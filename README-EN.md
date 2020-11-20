# vue-native-websocket-vue3 &middot; [![npm version](assets/svg/npm-v3.0.2.svg)](https://www.npmjs.com/package/vue-native-websocket-vue3) [![yarn version](assets/svg/yarn-v3.0.2.svg)](https://classic.yarnpkg.com/zh-Hans/package/vue-native-websocket-vue3) [![github depositary](assets/svg/GitHub-depositary.svg)](https://github.com/likaia/vue-native-websocket-vue3)
Websocket plugin that supports vue 3 and vuex 

Chinese documents please move: [README.md](README.md)
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

### Plug-in configuration items
The plug-in provides some configuration options, which improves the flexibility of the plug-in and better adapts to the business needs of developers.

#### Enable Vuex integration
Import `vuex` in `main.ts | main.js`, when using the plug-in, the third parameter is that the user can pass the configuration item, he is an object type, add the `store` attribute to the object, the value is imported Vuex.

```typescript
import store from "./store";

app.use(VueNativeSock,"",{
    store: store
});
```
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
      console.info("消息系统重连中...", state, count);
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

// index.js
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
        this.store[method](target, msg);
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
this.$options.sockets.onmessage = (res: { data: string }) => {
  console.log(data);
}
```
Remove message monitoring
```typescript
delete this.$options.sockets.onmessage
```

## Write at the end
So far, all the methods of using the plug-in have been introduced.

If you want to know more about the plug-in source code, please move to the project's Git Hub repository：[vue-native-websocket-vue3](https://github.com/likaia/vue-native-websocket-vue3)

Original plug-in code address: [vue-native-websocket](https://github.com/nathantsoi/vue-native-websocket)
