import Observer from "./socket-server/Observer";
import Emitter from "./socket-server/Emitter";
import { websocketOpts } from "./type/PluginsType";
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { App } from "vue";

export default {
  install(
    app: App,
    connection: string,
    opts: websocketOpts = { format: "" }
  ): void {
    // 没有传入连接，抛出异常 | No incoming connection, throw an exception
    if (!connection) {
      throw new Error("[vue-native-socket] cannot locate connection");
    }

    let observer: Observer;

    opts.$setInstance = (wsInstance: EventTarget) => {
      // 全局属性添加$socket | Add $socket to global properties
      app.config.globalProperties.$socket = wsInstance;
    };

    // 配置选项中启用手动连接 | Enable manual connection in configuration options
    if (opts.connectManually) {
      app.config.globalProperties.$connect = (
        connectionUrl = connection,
        connectionOpts = opts
      ) => {
        // 调用者传入的参数中添加set实例 | Add a set instance to the parameters passed by the caller
        connectionOpts.$setInstance = opts.$setInstance;
        // 创建Observer建立websocket连接 | Create Observer to establish websocket connection
        observer = new Observer(connectionUrl, connectionOpts);
        // 全局添加$socket | Add $socket globally
        app.config.globalProperties.$socket = observer.WebSocket;
      };

      // 全局添加连接断开处理函数 | Globally add disconnection processing functions
      app.config.globalProperties.$disconnect = () => {
        if (observer && observer.reconnection) {
          // 重新连接状态改为false | Change the reconnection status to false
          observer.reconnection = false;
          // 移除重新连接计时器 | Remove the reconnection timer
          clearTimeout(observer.reconnectTimeoutId);
        }
        // 如果全局属性socket存在则从全局属性移除 | If the global attribute socket exists, remove it from the global attribute
        if (app.config.globalProperties.$socket) {
          // 关闭连接 | Close the connection
          app.config.globalProperties.$socket.close();
          delete app.config.globalProperties.$socket;
        }
      };
    } else {
      // 未启用手动连接 | Manual connection is not enabled
      observer = new Observer(connection, opts);
      // 全局添加$socket属性，连接至websocket服务器 | Add the $socket attribute globally to connect to the websocket server
      app.config.globalProperties.$socket = observer.WebSocket;
    }
    const hasProxy =
      typeof Proxy !== "undefined" &&
      typeof Proxy === "function" &&
      /native code/.test(Proxy.toString());

    app.mixin({
      created() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const vm = this;
        const sockets = this.$options["sockets"];

        if (hasProxy) {
          this.$options.sockets = new Proxy(
            {},
            {
              set(target: any, key: any, value: any): boolean {
                // 添加监听 | Add monitor
                Emitter.addListener(key, value, vm);
                target[key] = value;
                return true;
              },
              deleteProperty(target: { key: any }, key: any): boolean {
                // 移除监听 | Remove monitor
                Emitter.removeListener(key, vm.$options.sockets[key], vm);
                delete target.key;
                return true;
              }
            }
          );
          app.config.globalProperties.sockets = new Proxy(
            {},
            {
              set(target: any, key: any, value: any): boolean {
                // 添加监听 | Add monitor
                Emitter.addListener(key, value, vm);
                target[key] = value;
                return true;
              },
              deleteProperty(target: { key: any }, key: any): boolean {
                // 移除监听 | Remove monitor
                Emitter.removeListener(key, vm.$options.sockets[key], vm);
                delete target.key;
                return true;
              }
            }
          );
          if (sockets) {
            Object.keys(sockets).forEach((key: string) => {
              // 给$options中添加sockets中的key | Add the key in sockets to $options
              this.$options.sockets[key] = sockets[key];
              app.config.globalProperties.sockets[key] = sockets[key];
            });
          }
        } else {
          // 将对象密封，不能再进行改变 | Seal the object so that it cannot be changed
          Object.seal(this.$options.sockets);
          Object.seal(app.config.globalProperties.sockets);
          if (sockets) {
            Object.keys(sockets).forEach((key: string) => {
              // 添加监听 | Add monitor
              Emitter.addListener(key, sockets[key], vm);
            });
          }
        }
      },
      beforeUnmount() {
        if (hasProxy) {
          const sockets = this.$options["sockets"];

          if (sockets) {
            Object.keys(sockets).forEach((key: string) => {
              // 销毁前如果代理存在sockets存在则移除$options中给sockets添加过的key | If the proxy has sockets before destruction, remove the keys added to sockets in $options
              delete this.$options.sockets[key];
              delete app.config.globalProperties.sockets;
            });
          }
        }
      }
    });
  }
};
