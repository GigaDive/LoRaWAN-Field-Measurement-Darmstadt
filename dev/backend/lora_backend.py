import asyncio
from contextlib import AsyncExitStack, asynccontextmanager
from multiprocessing.sharedctypes import Value
from random import randrange
from tkinter import E
from asyncio_mqtt import Client, MqttError
import json, os, re, time, glob, random, string, base64
import queue
import datetime 
from autobahn.asyncio.websocket import WebSocketServerFactory,WebSocketServerProtocol
import geopy.distance
from config import GATEWAY_METADATA, GENERATE_TESTDATA, CHUNK_SIZE,WEBSOCKET_URL,HTTP_ENABLED
#asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def async_backend():
    """Async handler to coordinate receiving post requests from the chirpstack backend and
    sending the incomming data to multiple websocket clients. 💛"""

    queue = asyncio.Queue()
    peer_list = []
    async with AsyncExitStack() as stack:
        # Keep track of the asyncio tasks that we create, so that
        # we can cancel them on exit
        tasks = set()
        loop = asyncio.get_event_loop()
        factory = WebSocketServerFactory(loop=loop)
        factory.protocol = MyServerProtocol
        factory.protocol.queue = queue
        factory.protocol.peer_list = peer_list
        if HTTP_ENABLED:
            webserver_protocol = EchoServerProtocol()
            webserver_protocol.queue = queue
            webserver_protocol.tasks = tasks
            http = loop.create_server(lambda: webserver_protocol, '', 1337)
            http_server = asyncio.create_task(http)
            tasks.add(http_server)
        coro = loop.create_server(factory, WEBSOCKET_URL, 9000)
        websocket_server = asyncio.create_task(coro)
        asyncio.set_event_loop(loop)
        stack.push_async_callback(cancel_tasks, tasks)
        # stack.push_async_callback(cancel_tasks, coro)
        tasks.add(websocket_server)
        broadcaster = asyncio.create_task(broadcast_messages(peer_list,queue))
        tasks.add(broadcaster)
        
        # Wait for everything to complete (or fail due to, e.g., network
        # errors)
        await asyncio.gather(*tasks)

async def seek_history(client):
    """Load history data from csv file and forwards to frontend"""

    if os.path.exists('logging'):
        history = []
        print("logging exists")
        for filename in glob.glob('logging/*.csv'):
            print(filename)
            with open(os.path.join(os.getcwd(), filename), 'r') as f: # open in readonly mode
                history.extend([json.loads(line.rstrip()) for line in f.readlines()])

        len_history = len(history)
        temp = []
        element = {}
        chunked_list = list()
        for i in range(0, len(history), CHUNK_SIZE):
            chunked_list.append(history[i:i+CHUNK_SIZE])

        for chunk in chunked_list:
            element = create_packet(chunk, True, len_history)
            print(len(chunk))
            try:
                client.sendMessage(json.dumps(element).encode("UTF-8"), False)
            except Exception as e:
                print(e)
            await asyncio.sleep(.1) #Delay um mal den effekt zu demonstrieren

def create_packet(data, isHistory=False, len_history=0):
    """Central function to create and prepare packets before they are saved or sent. 
    Gateway location is injected here. Solution for missing metadata from the chirpstack endpoint."""
    if isHistory:
        modified_data = []
        for packet in data:
            if isinstance(packet, str):
                packet = json.loads(packet)

            measurement_coord = packet["object"]["objectJSON"]["gpsLocation"]["136"]
            rxInfos = []
            for element in packet["object"]["rxInfo"]:
                if element["gatewayID"] in GATEWAY_METADATA:
                    gateway_coord = GATEWAY_METADATA[element["gatewayID"]]
                    gateway_coord["id"] = element["gatewayID"]
                    gw_coord = (gateway_coord["latitude"], gateway_coord["longitude"])
                    m_coord = (measurement_coord["latitude"], measurement_coord["longitude"])
                    element["gwcoord"] = gateway_coord
                    element["distance"] = geopy.distance.geodesic(gw_coord, m_coord).m
                else:
                    print(f"MISSING GW ID: {element['gatewayID']}")
                    
                rxInfos.append(element)
            inner_packet = packet["object"]
            inner_packet["rxInfo"] = rxInfos
            packet = {"type":"broadcast","timestamp":datetime.datetime.now().isoformat(),"object":inner_packet}
            modified_data.append(packet)
        data = {"type":"history","history_size":len_history, "object":modified_data}
    else:
        if isinstance(data, str):
            data = json.loads(data)

        data["objectJSON"] = json.loads(data["objectJSON"])
        measurement_coord = data["objectJSON"]["gpsLocation"]["136"]
        rxInfos = []
        for element in data["rxInfo"]:
            element["gatewayID"] = base64.b64decode(element["gatewayID"]).hex()
            if element["gatewayID"] in GATEWAY_METADATA:
                gateway_coord = GATEWAY_METADATA[element["gatewayID"]]
                gateway_coord["id"] = element["gatewayID"]
                gw_coord = (gateway_coord["latitude"], gateway_coord["longitude"])
                m_coord = (measurement_coord["latitude"], measurement_coord["longitude"])
                element["gwcoord"] = gateway_coord
                element["distance"] = geopy.distance.geodesic(gw_coord, m_coord).m
                print(f"GW: {element['gatewayID']} - {element['distance']}m ")
            rxInfos.append(element)
        data["rxInfo"] = rxInfos
        data = {"type":"broadcast","object":data}
        data["timestamp"] = datetime.datetime.now().isoformat()
        print(data)

    return data

def send_messages(peer_list,element):
    """Sending one message to many clients."""
    for p in peer_list:
        try:
            p.sendMessage(json.dumps(element).encode("utf-8"),False)
        except Exception as e:
            print(e)
            
async def broadcast_messages(peer_list,queue):
    """Receives messages from the queue und forwards it to the frontend"""

    while True:
        if GENERATE_TESTDATA:
            send_messages(peer_list, create_packet(generateData()))
            await asyncio.sleep(1)
        else:
            send_messages(peer_list, await queue.get())

async def log_messages(messages, template,queue):
    """
    Logging method for MQTT Integration
    NOT used if MQTT is disabled
    """
    async for message in messages:
        if re.findall('application/1/device/.{16}/event/up', message.topic):
            data =  json.loads(message.payload)
            device_dir = f'./logging/{data["applicationName"]}_{data["deviceName"]}.csv'

            if not os.path.exists('logging'):
                os.makedirs('logging')

            with open(device_dir, "a") as log:
                json.dump(data, log)
                log.write('\n')
                log.flush()

        if re.findall('application/.*', message.topic):
            if message.payload is None:
                return

            data =  json.loads(message.payload)
            device_dir = f'./logging/raw_{data["applicationName"]}_{data["deviceName"]}.raw'

            if not os.path.exists('logging'):
                os.makedirs('logging')

            with open(device_dir, "a") as log:
                    json.dump(data, log)
                    log.write('\n')
                    log.flush()
        await queue.put(message.payload)

async def cancel_tasks(tasks):
    """Function to halt finished tasks and hand over to the next active one."""
    for task in tasks:
        if task.done():
            continue
        try:
            task.cancel()
            await task
        except asyncio.CancelledError:
            pass

class MyServerProtocol(WebSocketServerProtocol):
    """Server Protocol containing important calls to process for each socket individually.
    This allows that multiple clients can stream live data from the backend.
    """

    queue = None
    peer_list = None
    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))
        self.peer_list.append(self)
    def onOpen(self):
        print("WebSocket connection open.")
        print(f"New Peer: {self.peer}")

    def onMessage(self, payload, isBinary):
        if isBinary:
            print("Binary message received: {0} bytes".format(len(payload)))
        else:
            print("Text message received: {0}".format(payload.decode('utf8')))
        print(payload.decode('utf8'))
        asyncio.get_event_loop().create_task(seek_history(self))

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))
        for x in self.peer_list:
            if x.peer == self.peer:
                self.peer_list.remove(self)
                break

    async def load_msg(self):
        await asyncio.sleep(2)
        return "testmsg"

    async def sendmsg(self, qu):
        while True:
            # elem = await qu.get()
            print(f"Peer: {self.peer}")


def generateData(fCnt=0):
    """Generates some random test data for frontend visualization
        Flag in config.py has to be set. In it's current state the
        testdata generator doesn't fit the necessary JSON format that the frontend needs."""

    dr = [5,4,3,2,1,0]
    frequency = [868500000,867100000,867500000,867900000,867100000,868100000]
    device_names = ["NODE_AB_AT1","NODE_AB_AT2","NODE_XX_AT1"]
    gw_ids = ["aa555a0000000000","bb111c0000000000"]

    data = """
    {
    "applicationID":"1",
    "applicationName":"App",
    "deviceName":"KNOTEN",
    "deviceProfileName":"KNOTEN",
    "deviceProfileID":"34e82b53-16b3-45f0-85a6-31299d57f1a5",
    "devEUI":"AAAAAAAAAAE=",
    "rxInfo":[
        {
            "gatewayID":"AAAAAAAAAAA=",
            "uplinkID":"eb041eb4-c18d-45c9-8a0e-27abad5eaec6",
            "name":"Dev2",
            "time":"1999-11-30T00:00:00.090268Z",
            "rssi":-105,
            "loRaSNR":-0.2,
            "location":{
                "latitude":0,
                "longitude":0,
                "altitude":0
            }
        }
    ],
    "txInfo": {"frequency": 867700000, "modulation": "LORA",
    "loRaModulationInfo": {"bandwidth": 125, "spreadingFactor": 7, "codeRate": "4/5", "polarizationInversion": false}},
    "adr":false,
    "fCnt":35,
    "fPort":2,
    "data":"iIgHpJUBQa4AQq4=",
    "objectJSON":{
        "gpsLocation":{
            "136":{
            "altitude":170.7,
            "latitude":50.0885,
            "longitude":8.235
            }
        }
    }
}"""

    data = json.loads(data)
    data["deviceName"] = random.choice(device_names)
    # data["devEUI"] = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    data["deviceProfileID"] = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
    data["fCnt"] = fCnt
    data["fPort"] = 2
    data["txInfo"]["frequency"] = random.choice(frequency)
    data["txInfo"]["dr"] = random.choice(dr)

    data["rxInfo"][0]["time"] = str(datetime.datetime.now().isoformat())
    data["rxInfo"][0]["rssi"] = random.randint(70,130)*-1
    data["rxInfo"][0]["loRaSNR"] =  random.random()*10
    data["rxInfo"][0]["gatewayID"] = random.choice(gw_ids)

    data["objectJSON"]["gpsLocation"]["136"]["altitude"] = round(168+random.uniform(-20.00, 20.0),2)
    data["objectJSON"]["gpsLocation"]["136"]["latitude"] = round(50.0884+random.uniform(-0.09, 0.09),4)
    data["objectJSON"]["gpsLocation"]["136"]["longitude"] = round(8.2353+random.uniform(-0.09, 0.09),4)
    data["objectJSON"] = json.dumps( data["objectJSON"])
    return data

class EchoServerProtocol(asyncio.Protocol):
    """Class to handle HTTP Integration from Chirpstack"""
    queue = None
    tasks = None
    def __init__(self):
        self.local_queue = queue.Queue()

    def connection_made(self, transport):
        peername = transport.get_extra_info('peername')
        print('Connection from {}'.format(peername))
        self.transport = transport
        

    def data_received(self, data):
        """
        Receives the POST Request from the HTTP Integration in Chirpstack,
        logs it to .csv file and forwards it to the frontend. The data is processed
        that output of the chirpstack with nodes from
        """
        message = data.decode()
        if 'POST' in message:
            JSON_only = re.findall("\{.*\}", message) # altitude\":[0-9]
            if "objectJSON" in JSON_only[0]:
                data = json.loads(JSON_only[0])
                ### Adding timestamp for being able to identify the data and sort it in the frontend.
                data["timestamp"] = datetime.datetime.now().isoformat()
                ### USED FOR FRANK'S NODE
                coords = base64.b64decode(data["data"]).decode("utf-8")
                coords = re.findall("[0-9]*\.[0-9]*", coords)
                data['objectJSON'] = "{\"gpsLocation\":{\"136\":{\"latitude\": " + coords[0] + ",\"longitude\":" + coords[1] + ",\"altitude\":160.3}}}"

                ### LOG raw packet 
                device_dir = f'./logging/{data["applicationName"]}_{data["deviceName"]}.raw'
                print(f"RAW Packet: {data}")
                if not os.path.exists('logging'):
                    os.makedirs('logging')
                with open(device_dir, "a") as log:
                    log.write(json.dumps(data))
                    log.write('\n')
                    log.flush()
                    
                ### LOG formatted packet
                packet = create_packet(data)
                device_dir = f'./logging/{data["applicationName"]}_{data["deviceName"]}.csv'
                if not os.path.exists('logging'):
                    os.makedirs('logging')
                asyncio.get_event_loop().create_task(self.queue.put(packet))
                with open(device_dir, "a") as log:
                    log.write(json.dumps(packet))
                    log.write('\n')
                    log.flush()

                print(f"Successfully wrote to {device_dir}")
            else:
                print("ERROR: objectJSON not found in JSON object")
                print(message)
        else:
            print("ERROR: Didn't receive a POST Request")
        print('Data received, closing client socket')
        self.transport.close()


async def main():
    """Python main function to run the LoRa backend and
    provide logging and websocket connection to the react frontend."""
    # Run the async_backend indefinitely. Reconnect automatically
    # if the connection is lost.
    reconnect_interval = 3  # [seconds]
    while True:
        try:
            await async_backend()
        except MqttError as error:
            print(f'Error "{error}". Reconnecting in {reconnect_interval} seconds.')
        finally:
            await asyncio.sleep(reconnect_interval)

asyncio.run(main())
