# vue3-native-websocket
仅支持vue3的websocket插件 | Only supports vue3 websocket plugin

English documents please move: [README-EN.md](README-EN.md)

本插件改造自[vue-native-websocket-vue3](https://github.com/likaia/vue-native-websocket-vue3)，如果项目使用Vuex，建议使用原插件。

本插件仅做了支持Pinia的兼容处理。

## 插件安装

```bash
npm install vue3-native-websocket --save
```

## 插件使用
如果你的项目启用了TypeScript，则在`main.ts`文件中导入并使用插件。

没有启用就在`main.js`中导入并使用。

使用插件时，第二个参数为必填项，是你的`websocket`服务端连接地址。

```typescript
import VueNativeSock from "vue3-native-websocket";

// 使用VueNativeSock插件，并进行相关配置
app.use(VueNativeSock,"");
```

> 注意：插件依赖于Vuex，你的项目一定要安装vuex才可以使用本插件。vuex的相关配置请查阅文档后面的插件配置项中的内容。

### 插件配置项
插件提供了一些配置选项，提高了插件的灵活度，能更好的适配开发者的业务需求。

#### 启用Vuex集成
在`main.ts | main.js`中导入`vuex`，在使用插件时，第三个参数就是用户可以传配置项，他为一个对象类型，在对象中加入`store`属性，值为导入的vuex。

```typescript
import store from "./store";

app.use(VueNativeSock,"",{
    store: store
});
```
如果启用了vuex集成，就需要在其配置文件中定义state以及mutations方法。mutations中定义的方法为websocket的6个监听，你可以在这几个监听中做相应的操作。
```typescript
import { createStore } from "vuex";
import main from "../main";

export default createStore({
  state: {
    socket: {
      // 连接状态
      isConnected: false,
      // 消息内容
      message: "",
      // 重新连接错误
      reconnectError: false,
      // 心跳消息发送时间
      heartBeatInterval: 50000,
      // 心跳定时器
      heartBeatTimer: 0
    }
  },
  mutations: {
    // 连接打开
    SOCKET_ONOPEN(state, event) {
      main.config.globalProperties.$socket = event.currentTarget;
      state.socket.isConnected = true;
      // 连接成功时启动定时发送心跳消息，避免被服务器断开连接
      state.socket.heartBeatTimer = setInterval(() => {
        const message = "心跳消息";
        state.socket.isConnected &&
          main.config.globalProperties.$socket.sendObj({
            code: 200,
            msg: message
          });
      }, state.socket.heartBeatInterval);
    },
    // 连接关闭
    SOCKET_ONCLOSE(state, event) {
      state.socket.isConnected = false;
      // 连接关闭时停掉心跳消息
      clearInterval(state.socket.heartBeatTimer);
      state.socket.heartBeatTimer = 0;
      console.log("连接已断开: " + new Date());
      console.log(event);
    },
    // 发生错误
    SOCKET_ONERROR(state, event) {
      console.error(state, event);
    },
    // 收到服务端发送的消息
    SOCKET_ONMESSAGE(state, message) {
      state.socket.message = message;
    },
    // 自动重连
    SOCKET_RECONNECT(state, count) {
      console.info("消息系统重连中...", state, count);
    },
    // 重连错误
    SOCKET_RECONNECT_ERROR(state) {
      state.socket.reconnectError = true;
    }
  },
  modules: {}
});
```
##### 自定义方法名
你也可以自定义`mutations`中自定义websocket的默认监听事件名。
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

#### 启用pinia集成
在`main.js | main.ts`中导入`pinia`，使用插件传入导入的pinia。
```typescript
import { useSocketStoreWithOut } from './useSocketStore';

const store = useSocketStoreWithOut();

app.use(VueNativeSock, "", {
    store: store
});
```
还需要在配置文件中定义actions，由于pinia去除了mutations，因此这里的配置与vuex不同。
```typescript
import { defineStore } from 'pinia';
import { store } from '/@/store';
import main from '/@/main';

interface SocketStore {
  // 连接状态
  isConnected: boolean;
  // 消息内容
  message: string;
  // 重新连接错误
  reconnectError: boolean;
  // 心跳消息发送时间
  heartBeatInterval: number;
  // 心跳定时器
  heartBeatTimer: number;
}

export const useSocketStore = defineStore({
  id: 'socket',
  state: (): SocketStore => ({
    // 连接状态
    isConnected: false,
    // 消息内容
    message: '',
    // 重新连接错误
    reconnectError: false,
    // 心跳消息发送时间
    heartBeatInterval: 50000,
    // 心跳定时器
    heartBeatTimer: 0,
  }),
  actions: {
    // 连接打开
    SOCKET_ONOPEN(event) {
      main.config.globalProperties.$socket = event.currentTarget;
      this.isConnected = true;
      // 连接成功时启动定时发送心跳消息，避免被服务器断开连接
      this.heartBeatTimer = window.setInterval(() => {
        const message = '心跳消息';
        this.isConnected &&
          main.config.globalProperties.$socket.sendObj({
            code: 200,
            msg: message,
          });
      }, this.heartBeatInterval);
    },
    // 连接关闭
    SOCKET_ONCLOSE(event) {
      this.isConnected = false;
      // 连接关闭时停掉心跳消息
      window.clearInterval(this.heartBeatTimer);
      this.heartBeatTimer = 0;
      console.log('连接已断开: ' + new Date());
      console.log(event);
    },
    // 发生错误
    SOCKET_ONERROR(event) {
      console.error(event);
    },
    // 收到服务端发送的消息
    SOCKET_ONMESSAGE(message) {
      this.message = message;
    },
    // 自动重连
    SOCKET_RECONNECT(count) {
      console.info('消息系统重连中...', count);
    },
    // 重连错误
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

为了方便在组件外面使用pinia，这里额外导出了`useSocketStoreWithOut`，否则pinia会报错，提示找不到pinia实例。

引入的`store`代码如下：
```typescript
import type { App } from 'vue';
import { createPinia } from 'pinia';

const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };
```


#### 其它配置
> 下述方法，均为插件的可传参数，可以和`store`搭配使用

* 设置websocket子协议默，认为空字符串。
```json
{
    "protocol": "my-protocol"
}
```
* 启用JSON消息传递，开启后数据发送与接收均采用json作为数据格式。
```json
{ 
    "format": "json"
}
```

> 如果你没启用JSON消息传递，只能使用`send`方法来发送消息.

* 启用自动重连`reconnection`,启用时可配置重连次数`reconnectionAttempts`与重连间隔时长`reconnectionDelay`
```json
{
  "reconnection": true,
  "reconnectionAttempts": 5, 
  "reconnectionDelay": 3000
}
```

* 手动管理连接
```json
{
  "connectManually": true
}
```
启用手动管理连接后，项目启动时则不会自动连接，你可以在项目的特定组件调用连接方法来进行连接。在组件销毁时调用关闭方法来关闭连接。
> 如果你启用了手动连接，必须要要启用vuex，否则此设置将不会生效。
```typescript
  // 连接websocket服务器，参数为websocket服务地址
  this.$connect("");
  // 关闭连接
  this.$disconnect();
```
* 自定义socket事件处理
  触发vuex里的mutations事件时，你可以选择自己写函数处理，做你想做的事情，在使用插件时传入`passToStoreHandler`参数即可，如果你没有传则走默认的处理函数，默认函数的定义如下:
```typescript
export default class {
    /**
     * 默认的事件处理函数
     * @param eventName 事件名称
     * @param event 事件
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
        // 事件名称开头不是SOCKET_则终止函数
        if (!eventName.startsWith("SOCKET_")) {
            return;
        }
        let method = "commit";
        // 事件名称字母转大写
        let target = eventName.toUpperCase();
        // 消息内容
        let msg = event;
        // data存在且数据为json格式
        if (this.format === "json" && event.data) {
            // 将data从json字符串转为json对象
            msg = JSON.parse(event.data);
            // 判断msg是同步还是异步
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
        // 触发store中的方法 | Trigger the method in the store
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
当你要自定义一个函数时，这个函数接收3个参数：
* event name 事件名
* event 事件
* 默认事件处理，这使你可以选择将事件移交给原始处理程序之前进行一些基本的预处理

下面是一个例子
```typescript
app.use(VueNativeSock, "", {
  passToStoreHandler: function (eventName, event, next) {
      event.data = event.should_have_been_named_data
      next(eventName, event)
  }
})
```


### 在组件中使用
做完上述配置后，就可以在组件中使用了，如下所示为发送数据的例子。
```typescript
export default defineComponent({
  methods: {
    clickButton: function(val) {
        // 调用send方法，以字符串形式发送数据
        this.$socket.send('some data');
        // 如果fomat配置为了json，即可调用sendObj方法来发送数据
        this.$socket.sendObj({ awesome: 'data'} );
    }
  }
})
```

> 注意：`sendObj`方法必须在你启用JSON消息传递时才可以使用，不然只能使用`send`方法。

消息监听，即接收websocket服务端推送的消息，如下所示为消息监听的示例代码。
```typescript
// optionsAPI用法
this.$options.sockets.onmessage = (res: { data: string }) => {
  console.log(data);
}

// CompositionAPI用法
import { getCurrentInstance } from "vue";
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
proxy.$socket.onmessage = (res: {
  data: string;
}) => {
  console.log(data);
}
```

发送消息，向服务端推送消息
```typescript
// optionsAPI用法
this.$socket.sendObj({msg: '消息内容'});

// compositionAPI写法
const internalInstance = data.currentInstance;
internalInstance?.proxy.$socket.sendObj({
  msg: "消息内容"
});
```
> compositionAPI写法由于在setup中无法拿到vue实例，因此需要在页面挂载后将实例存储到全局对象中，用的时候再将实例取出来。详细使用方法可以参考我的chat-system中的写法：[InitData.ts#L91](https://github.com/likaia/chat-system/blob/cacf587061f3a56198ade33a2c5bebeacec004a5/src/module/message-display/main-entrance/InitData.ts#L91) 、[EventMonitoring.ts#L50](https://github.com/likaia/chat-system/blob/db35173c8e54834a117ac8cb5a3753e75d9b1161/src/module/message-display/main-entrance/EventMonitoring.ts#L50) 、[SendMessage.ts#L73](https://github.com/likaia/chat-system/blob/db35173c8e54834a117ac8cb5a3753e75d9b1161/src/module/message-display/components-metords/SendMessage.ts#L73) 、[contact-list.vue#L620](https://github.com/likaia/chat-system/blob/91fe072a20d0928ff2af6c1bf56cedd0e545d0d5/src/views/contact-list.vue#L620)

移除消息监听
```typescript
delete this.$options.sockets.onmessage
```

## 写在最后
至此，插件的所有使用方法就介绍完了。

想进一步了解插件源码的请移步项目的GitHub仓库：[vue-native-websocket-vue3](https://github.com/likaia/vue-native-websocket-vue3)

Vue2版本请移步原插件：[vue-native-websocket](https://github.com/nathantsoi/vue-native-websocket)
