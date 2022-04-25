import Emitter from "./Emitter";
import { websocketOpts } from "@/type/pluginsType";

export default class {
  private readonly format: string; // 数据传输格式 | Data transmission format
  private readonly connectionUrl: string; // 连接url | Connection url
  private readonly opts: websocketOpts; // 调用者可以传入的自定义参数 | Custom parameters that the caller can pass in
  public reconnection: boolean; // 是否开启重连 | Whether to enable reconnection
  private readonly reconnectionAttempts: number; // 最大重连次数 | Maximum number of reconnections
  private readonly reconnectionDelay: number; // 重连间隔时间 | Reconnection interval
  private reconnectTimeoutId = 0; // 重连超时id | Reconnect timeout id
  private reconnectionCount = 0; // 已重连次数 | Reconnected times
  private readonly passToStoreHandler: any; // 传输数据时的处理函数 | Processing function when transferring data
  private readonly store: any; // 启用vuex时传入vuex的store | Pass in vuex store when vuex is enabled
  private readonly mutations: any; // 启用vuex时传入vuex中的mutations | Pass in the mutations in vuex when vuex is enabled
  public WebSocket: WebSocket | undefined; // websocket连接 | websocket connection
  /**
   * 观察者模式, websocket服务核心功能封装 | Observer mode, websocket service core function package
   * @param connectionUrl 连接的url
   * @param opts 其它配置项 | Other configuration items
   */
  constructor(connectionUrl: string, opts: websocketOpts = { format: "" }) {
    // 获取参数中的format并将其转成小写 | Get the format in the parameter and convert it to lowercase
    this.format = opts.format && opts.format.toLowerCase();

    // 如果url以//开始对其进行处理添加正确的websocket协议前缀 | If the URL starts with // to process it, add the correct websocket protocol prefix
    if (connectionUrl.startsWith("//")) {
      // 当前网站如果为https请求则添加wss前缀否则添加ws前缀 | If the current website is an https request, add the wss prefix, otherwise add the ws prefix
      const scheme = window.location.protocol === "https:" ? "wss" : "ws";
      connectionUrl = `${scheme}:${connectionUrl}`;
    }
    // 将处理好的url和opts赋值给当前类内部变量 | Assign the processed url and opts to the internal variables of the current class
    this.connectionUrl = connectionUrl;
    this.opts = opts;
    this.reconnection = this.opts.reconnection || false;
    this.reconnectionAttempts = this.opts.reconnectionAttempts || Infinity;
    this.reconnectionDelay = this.opts.reconnectionDelay || 1000;
    this.passToStoreHandler = this.opts.passToStoreHandler;

    // 建立连接 | establish connection
    this.connect(connectionUrl, opts);

    // 如果配置参数中有传store就将store赋值 | If store is passed in the configuration parameters, store will be assigned
    if (opts.store) {
      this.store = opts.store;
    }
    // 如果配置参数中有传vuex的同步处理函数就将mutations赋值 | If there is a synchronization processing function that passes vuex in the configuration parameters, assign mutations
    if (opts.mutations) {
      this.mutations = opts.mutations;
    }
    // 事件触发
    this.onEvent();
  }

  // 连接websocket | Connect websocket
  connect(
    connectionUrl: string,
    opts: websocketOpts = { format: "" }
  ): WebSocket {
    // 获取配置参数传入的协议 | Get the protocol passed in the configuration parameter
    const protocol = opts.protocol || "";
    // 如果没传协议就建立一个正常的websocket连接否则就创建带协议的websocket连接 | If no protocol is passed, establish a normal websocket connection, otherwise, create a websocket connection with protocol
    this.WebSocket =
      opts.WebSocket ||
      (protocol === ""
        ? new WebSocket(connectionUrl)
        : new WebSocket(connectionUrl, protocol));
    // 启用json发送 | Enable json sending
    if (this.format === "json") {
      // 如果websocket中没有senObj就添加这个方法对象 | If there is no sen Obj in websocket, add this method object
      if (!("sendObj" in (this.WebSocket as WebSocket))) {
        // 将发送的消息转为json字符串 | Convert the sent message into a json string
        (this.WebSocket as WebSocket).sendObj = (obj: JSON) =>
          (this.WebSocket as WebSocket).send(JSON.stringify(obj));
      }
    }
    return this.WebSocket;
  }
  // 重新连接 | reconnect
  reconnect(): void {
    // 已重连次数小于等于设置的连接次数时执行重连 | Reconnect when the number of reconnections is less than or equal to the set connection times
    if (this.reconnectionCount <= this.reconnectionAttempts) {
      this.reconnectionCount++;
      // 清理上一次重连时的定时器 | Clear the timer of the last reconnection
      window.clearTimeout(this.reconnectTimeoutId);
      // 开始重连
      this.reconnectTimeoutId = window.setTimeout(() => {
        // 如果启用vuex就触发vuex中的重连方法 | If vuex is enabled, the reconnection method in vuex is triggered
        if (this.store) {
          this.passToStore("SOCKET_RECONNECT", this.reconnectionCount);
        }
        // 重新连接 | reconnect
        this.connect(this.connectionUrl, this.opts);
        // 触发WebSocket事件 | Trigger Web Socket events
        this.onEvent();
      }, this.reconnectionDelay);
    } else {
      // 如果启用vuex则触发重连失败方法 | If vuex is enabled, the reconnection failure method is triggered
      if (this.store) {
        this.passToStore("SOCKET_RECONNECT_ERROR", true);
      }
    }
  }

  // 事件分发 | Event distribution
  onEvent(): void {
    ["onmessage", "onclose", "onerror", "onopen"].forEach(
      (eventType: string) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        (this.WebSocket as WebSocket)[eventType] = (event: any) => {
          Emitter.emit(eventType, event);

          // 调用vuex中对应的方法 | Call the corresponding method in vuex
          if (this.store) {
            this.passToStore("SOCKET_" + eventType, event);
          }

          // 处于重新连接状态切事件为onopen时执行 | Execute when the event is onopen in the reconnect state
          if (this.reconnection && eventType === "onopen") {
            // 设置实例 | Setting example
            this.opts.$setInstance &&
              this.opts.$setInstance(event.currentTarget);
            // 清空重连次数 | Empty reconnection times
            this.reconnectionCount = 0;
          }

          // 如果处于重连状态且事件为onclose时调用重连方法 | If in the reconnect state and the event is onclose, call the reconnect method
          if (this.reconnection && eventType === "onclose") {
            this.reconnect();
          }
        };
      }
    );
  }

  /**
   * 触发vuex中的方法 | Trigger methods in vuex
   * @param eventName 事件名称
   * @param event 事件
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  passToStore(eventName: string, event: any): void {
    // 如果参数中有传事件处理函数则执行自定义的事件处理函数，否则执行默认的处理函数 | If there is an event processing function in the parameter, the custom event processing function is executed, otherwise the default processing function is executed
    if (this.passToStoreHandler) {
      this.passToStoreHandler(
        eventName,
        event,
        this.defaultPassToStore.bind(this)
      );
    } else {
      this.defaultPassToStore(eventName, event);
    }
  }

  /**
   * 默认的事件处理函数 | The default event handler
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
    // 事件名称开头不是SOCKET_则终止函数 | If the beginning of the event name is not SOCKET_ then terminate the function
    if (!eventName.startsWith("SOCKET_")) {
      return;
    }
    let method = "commit";
    // 事件名称字母转大写 | Turn the letter of the event name to uppercase
    let target = eventName.toUpperCase();
    // 消息内容 | Message content
    let msg = event;
    // data存在且数据为json格式 | data exists and the data is in json format
    if (this.format === "json" && event.data) {
      // 将data从json字符串转为json对象 | Convert data from json string to json object
      msg = JSON.parse(event.data);
      // 判断msg是同步还是异步 | Determine whether msg is synchronous or asynchronous
      if (msg.mutation) {
        target = [msg.namespace || "", msg.mutation]
          .filter((e: string) => !!e)
          .join("/");
      } else if (msg.action) {
        method = "dispatch";
        target = [msg.namespace || "", msg.action]
          .filter((e: string) => !!e)
          .join("/");
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

// 扩展全局对象 | Extended global object
declare global {
  // 扩展websocket对象，添加sendObj方法 | Extend websocket object, add send Obj method
  interface WebSocket {
    sendObj(obj: JSON): void;
  }
}
