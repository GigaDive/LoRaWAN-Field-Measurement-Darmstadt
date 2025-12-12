import { applyMiddleware, combineReducers, createStore } from 'redux';
import reduxThunk from 'redux-thunk';
import { updateHistoryReducer } from './reducers/history';

const rootReducer = combineReducers({
  history:     updateHistoryReducer,

})

/**
 * Redux store for providing an easy global state between all components.
 */
// const persistedRootReducer = persistReducer(rootPersistConfig, rootReducer);
const createStoreWithMiddleware = applyMiddleware(reduxThunk)(createStore);
const store = createStoreWithMiddleware(rootReducer);

// let persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export { store };

