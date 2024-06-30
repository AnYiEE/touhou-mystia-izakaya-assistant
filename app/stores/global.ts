import {createStoreContext, store} from '@davstack/store';

const globalStore = store({});

export const {Provider: GlobalStoreProvider, useStore: useGlobalStore} = createStoreContext(globalStore);
