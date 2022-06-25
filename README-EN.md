# vue-native-websocket-vue3 &middot; [![npm version](https://img.shields.io/badge/npm-v3.1.6-2081C1)](https://www.npmjs.com/package/vue-native-websocket-vue3) [![yarn version](https://img.shields.io/badge/yarn-v3.1.6-F37E42)](https://classic.yarnpkg.com/zh-Hans/package/vue-native-websocket-vue3)
Only supports vue3 websocket plugin

Chinese documents please move: [README.md](README.md)



Compatible handling for Pinia（Thanks to [@chuck](https:github.com Front To End) for the compatible code）

## Plug-in installation
```bash
yarn add vue-native-websocket-vue3

# or

npm install vue-native-websocket-vue3 --save
```

## Plug-in use
If Type Script is enabled in your project, import and use the plugin in the `main.ts` file.

Import and use it in `main.js` if it is not enabled.

When using the plug-in, the second parameter is required and is your `websocket` server connection address.

```typescript
import VueNativeSock from "vue-native-websocket-vue3";

// Use the Vue Native Sock plug-in and perform related configuration
app.use(VueNativeSock,"");
```

> payAttention：The plugin depends on Vuex, your project must install vuex to use this plugin. For the relevant configuration of vuex, please refer to the content in the plug-in configuration item at the back of the document.

> Similarly, the plugin also supports pinia, you can choose one of vuex and pinia. Please refer to the content in the plug-in configuration item at the back of the document for the related usage configuration of pinia.

### Plug-in configuration items
The plug-in provides some configuration options, which improves the flexibility of the plug-in and better adapts to the business needs of developers.

#### Enable Vuex integration
Import the configuration file of `vuex` in `main.ts | main.js`. When using the plug-in, the third parameter is that the user can pass the configuration item. It is an object type, and the `store` attribute is added to the object. Value is imported vuex.

```typescript
import store from "./store";

app.use(VueNativeSock,"",{
    store: store
});
```
> If you still don't know how to use it, you can refer to my other open source project[chat-system](https://github.com/likaia/chat-system/blob/master/src/main.ts)。 

If vuex integration is enabled, state and mutations methods need to be defined in its configuration file. The methods defined in mutations are 6 monitors of websocket, and you can do corresponding operations in these monitors.
```typescript
import { createStore } from "vuex";
import main from "../main";

export default createStore({
  state: {
    socket: {
      // Connection Status
      isConnected: false,
      // Message content
      message: "",
      // Reconnect error
      reconnectError: false,
      // Heartbeat message sending time
      heartBeatInterval: 50000,
      // Heartbeat timer
      heartBeatTimer: 0
    }
  },
  mutations: {
    // Connection open
    SOCKET_ONOPEN(state, event) {
      main.config.globalProperties.$socket = event.currentTarget;
      state.socket.isConnected = true;
      // When the connection is successful, start sending heartbeat messages regularly to avoid being disconnected by the server
      state.socket.heartBeatTimer = setInterval(() => {
        const message = "Heartbeat message";
        state.socket.isConnected &&
          main.config.globalProperties.$socket.sendObj({
            code: 200,
            msg: message
          });
      }, state.socket.heartBeatInterval);
    },
    // Connection closed
    SOCKET_ONCLOSE(state, event) {
      state.socket.isConnected = false;
      // Stop the heartbeat message when the connection is closed
      clearInterval(state.socket.heartBeatTimer);
      state.socket.heartBeatTimer = 0;
      console.log("The line is disconnected: " + new Date());
      console.log(event);
    },
    // An error occurred
    SOCKET_ONERROR(state, event) {
      console.error(state, event);
    },
    // Receive the message sent by the server
    SOCKET_ONMESSAGE(state, message) {
      state.socket.message = message;
    },
    // Auto reconnect
    SOCKET_RECONNECT(state, count) {
      console.info("Message system reconnecting...", state, count);
    },
    // Reconnect error
    SOCKET_RECONNECT_ERROR(state) {
      state.socket.reconnectError = true;
    }
  },
  modules: {}
});
```
##### Custom method name
You can also customize the default listener event name of custom websocket in `mutations`.
```typescript
// mutation-types.ts
const SOCKET_ONOPEN = '✅ Socket connected!'
const SOCKET_ONCLOSE = '❌ Socket disconnected!'
const SOCKET_ONERROR = '❌ Socket Error!!!'
const SOCKET_ONMESSAGE = 'Websocket message received'
const SOCKET_RECONNECT = 'Websocket reconnected'
const SOCKET_RECONNECT_ERROR = 'Websocket is having issues reconnecting..'

export {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
}

// store.ts
import { createStore } from "vuex";
import main from "../main";
import {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
} from "./mutation-types"

export default createStore({
  state: {
  socket: {
      isConnected: false,
      message: '',
      reconnectError: false,
     }
  },
  mutations: {
    [SOCKET_ONOPEN](state, event)  {
      state.socket.isConnected = true
    },
    [SOCKET_ONCLOSE](state, event)  {
      state.socket.isConnected = false
    },
    [SOCKET_ONERROR](state, event)  {
      console.error(state, event)
    },
    // default handler called for all methods
    [SOCKET_ONMESSAGE](state, message)  {
      state.socket.message = message
    },
    // mutations for reconnect methods
    [SOCKET_RECONNECT](state, count) {
      console.info(state, count)
    },
    [SOCKET_RECONNECT_ERROR](state) {
      state.socket.reconnectError = true;
    }
  },
  modules: {}
});

// main.js
import store from './store'
import {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
} from './mutation-types'

const mutations = {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
}

app.use(VueNativeSock,"",{
  store: store,
  mutations: mutations
});
```


#### Enable Pinia integration
Import `pinia`'s configuration file in `main.js|main.ts`.
```typescript
// use Socket Store is pinia's socket configuration file
import { useSocketStoreWithOut } from './useSocketStore';

const store = useSocketStoreWithOut();

app.use(VueNativeSock, "", {
    store: store
});
```
> I specially wrote a demo to demonstrate the integration of pinia, if you need a reference, please go to: [pinia-websocket-project](https://github.com/likaia/pinia-websocket-project)

The code of pinia's socket configuration file is as follows:
```typescript
import { defineStore } from 'pinia';
import { store } from '/@/store';
import main from '/@/main';

interface SocketStore {
  // Connection Status
  isConnected: boolean;
  // Message content
  message: string;
  // Reconnect error
  reconnectError: boolean;
  // Heartbeat message sending time
  heartBeatInterval: number;
  // Heartbeat timer
  heartBeatTimer: number;
}

export const useSocketStore = defineStore({
  id: 'socket',
  state: (): SocketStore => ({
    // Connection Status
    isConnected: false,
    // Message content
    message: '',
    // Reconnect error
    reconnectError: false,
    // Heartbeat message sending time
    heartBeatInterval: 50000,
    // Heartbeat timer
    heartBeatTimer: 0,
  }),
  actions: {
    // Connection open
    SOCKET_ONOPEN(event) {
      main.config.globalProperties.$socket = event.currentTarget;
      this.isConnected = true;
      // When the connection is successful, start sending heartbeat messages regularly to avoid being disconnected by the server
      this.heartBeatTimer = window.setInterval(() => {
        const message = 'Heartbeat message';
        this.isConnected &&
          main.config.globalProperties.$socket.sendObj({
            code: 200,
            msg: message,
          });
      }, this.heartBeatInterval);
    },
    // Connection closed
    SOCKET_ONCLOSE(event) {
      this.isConnected = false;
      // Stop the heartbeat message when the connection is closed
      window.clearInterval(this.heartBeatTimer);
      this.heartBeatTimer = 0;
      console.log('The line is disconnected: ' + new Date());
      console.log(event);
    },
    // An error occurred
    SOCKET_ONERROR(event) {
      console.error(event);
    },
    // Receive the message sent by the server
    SOCKET_ONMESSAGE(message) {
      this.message = message;
    },
    // Auto reconnect
    SOCKET_RECONNECT(count) {
      console.info('Message system reconnecting...', count);
    },
    // Reconnect error
    SOCKET_RECONNECT_ERROR() {
      this.reconnectError = true;
    },
  },
});

// Need to be used outside the setup
export function useSocketStoreWithOut() {
  return useSocketStore(store);
}
```

In order to facilitate the use of pinia outside the component, useSocketStoreWithOut is additionally exported here, otherwise pinia will report an error indicating that the pinia instance cannot be found.

The store configuration code of pinia is as follows:
```typescript
import type { App } from 'vue';
import { createPinia } from 'pinia';

const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };
```

#### Other configuration
> The following methods are all passable parameters of the plug-in and can be used with `store`

* Set the websocket sub-protocol default, consider it as an empty string.
```json
{
    "protocol": "my-protocol"
}
```
* Enable JSON messaging. After enabling, data sending and receiving will use json as the data format.
```json
{ 
    "format": "json"
}
```

* Enable automatic reconnection `reconnection`, when enabled, you can configure the number of reconnections `reconnection Attempts` and the reconnection interval duration `reconnection Delay`
```json
{
  "reconnection": true,
  "reconnectionAttempts": 5, 
  "reconnectionDelay": 3000
}
```

* Manually manage connections
```json
{
  "connectManually": true
}
```
After enabling manual connection management, the connection will not be automatically connected when the project starts. You can call the connection method on a specific component of the project to connect. Call the close method when the component is destroyed to close the connection.
> If you enable manual connection, you must enable vuex, otherwise this setting will not take effect.
```typescript
  // Connect to the websocket server, the parameter is the websocket service address
  this.$connect("");
  // Close the connection
  this.$disconnect();
  
  // CompositionAPI
  proxy.$connect("");
  proxy.$disconnect("");
```
* Custom socket event handling
  When triggering the mutations event in vuex, you can choose to write your own function processing, do what you want to do, pass in the `pass To Store Handler` parameter when using the plug-in, and if you don’t pass it, use the default processing function. The definition of the default function is as follows:
```typescript
export default class {
  /**
   * The default event handler
   * @param eventName
   * @param event
   */
  defaultPassToStore(
    eventName: string,
    event: {
      data: string;
      mutation: string;
      namespace: string;
      action: string;
    }
  ): void {
    // If the beginning of the event name is not SOCKET_ then terminate the function
    if (!eventName.startsWith("SOCKET_")) {
      return;
    }
    let method = "commit";
    // Turn the letter of the event name to uppercase
    let target = eventName.toUpperCase();
    // Message content
    let msg = event;
    // data exists and the data is in json format
    if (this.format === "json" && event.data) {
      // Convert data from json string to json object
      msg = JSON.parse(event.data);
      // Determine whether msg is synchronous or asynchronous
      if (msg.mutation) {
        target = [msg.namespace || "", msg.mutation].filter((e: string) => !!e).join("/");
      } else if (msg.action) {
        method = "dispatch";
        target = [msg.namespace || "", msg.action].filter((e: string) => !!e).join("/");
      }
    }
    if (this.mutations) {
      target = this.mutations[target] || target;
    }
    // Trigger methods in storm
    if (this.store._p) {
      // pinia
      target = eventName.toUpperCase();
      this.store[target](msg);
    } else {
      // vuex
      this.store[method](target, msg);
    }
  }
}
```
When you want to customize a function, this function receives 3 parameters:
* event name 
* event 
* Default event handling, which gives you the option to perform some basic preprocessing before handing over the event to the original handler

Below is an example
```typescript
app.use(VueNativeSock, "", {
  passToStoreHandler: function (eventName, event, next) {
      event.data = event.should_have_been_named_data
      next(eventName, event)
  }
})
```

### functions exposed by the plugin
* `send` Send non-json type data (JSON messaging cannot be enabled when using plugins)
* `sendObj` Send data of type json (JSON messaging must be enabled when using the plugin)
* `$connect` Connect to the websocket server (manually manage connections option must be enabled when using the plugin)
* `onmessage` listening when receiving server push messages
* `$disconnect` disconnectWebsocketConnection

> payAttention: The above methods are supported in the options API and Composition API. For specific usage, please refer to the documentation of the related functions.

### Use in components
After finishing the above configuration, it can be used in the component. The following shows an example of sending data.
```typescript
export default defineComponent({
  methods: {
    clickButton: function(val) {
        // Call the send method to send data as a string
        this.$socket.send('some data');
        // If fomat is configured as json, you can call the send Obj method to send data
        this.$socket.sendObj({ awesome: 'data'} );
    }
  }
})
```

Message monitoring means receiving messages pushed by the websocket server. The sample code for message monitoring is shown below.
```typescript
// optionsAPI
this.$options.sockets.onmessage = (res: { data: string }) => {
  console.log(data);
}

// CompositionAPI
import { getCurrentInstance } from "vue";
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
proxy.$socket.onmessage = (res: {
  data: string;
}) => {
  console.log(data);
}
```

Send messages, push messages to the server
```typescript
// optionsAPI
this.$socket.sendObj({msg: 'msgText'});

// compositionAPI
const internalInstance = data.currentInstance;
internalInstance?.proxy.$socket.sendObj({
  msg: "msgText"
});
```
> The composition API is written because the vue instance cannot be obtained in the setup, so the instance needs to be stored in the global object after the page is mounted, and then the instance is taken out when it is used. For detailed usage, please refer to the writing in my chat-system: [InitData.ts#L91](https://github.com/likaia/chat-system/blob/cacf587061f3a56198ade33a2c5bebeacec004a5/src/module/message-display/main-entrance/InitData.ts#L91) 、[EventMonitoring.ts#L50](https://github.com/likaia/chat-system/blob/db35173c8e54834a117ac8cb5a3753e75d9b1161/src/module/message-display/main-entrance/EventMonitoring.ts#L50) 、[SendMessage.ts#L73](https://github.com/likaia/chat-system/blob/db35173c8e54834a117ac8cb5a3753e75d9b1161/src/module/message-display/components-metords/SendMessage.ts#L73) 、[contact-list.vue#L620](https://github.com/likaia/chat-system/blob/91fe072a20d0928ff2af6c1bf56cedd0e545d0d5/src/views/contact-list.vue#L620)


Remove message monitoring
```typescript
delete this.$options.sockets.onmessage
// compositionAPI  writing
delete proxy.$socket.onmessage
```

## Write at the end
So far, all the methods of using the plug-in have been introduced.

If you want to know more about the plug-in source code, please move to the project's Git Hub repository：[vue-native-websocket-vue3](https://github.com/likaia/vue-native-websocket-vue3)

Please move to the original plugin for Vue 2 version: [vue-native-websocket](https://github.com/nathantsoi/vue-native-websocket)
