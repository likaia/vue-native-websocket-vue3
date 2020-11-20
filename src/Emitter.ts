export class Emitter<T = any> {
    private listeners;
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 添加事件监听 | Add event listener
     * @param label 事件名称 | Event name
     * @param callback 回调函数 | Callback
     * @param vm this对象 | this object
     * @return {boolean}
     */
    addListener(label: T, callback: (...params: T[]) => void, vm: T): boolean {
        if (typeof callback === "function") {
            // label不存在就添加 | add if label does not exist
            this.listeners.has(label) || this.listeners.set(label, []);
            // 向label添加回调函数 | Add callback function to label
            this.listeners.get(label).push({ callback: callback, vm: vm });
            return true;
        }
        return false;
    }

    /**
     * 移除监听 Remove monitor
     * @param label 事件名称 | Event name
     * @param callback 回调函数 | Callback
     * @param vm this对象 | this object
     * @return {boolean}
     */
    removeListener(label: T, callback: () => void, vm: T): boolean {
        // 从监听列表中获取当前事件 | Get the current event from the listener list
        const listeners = this.listeners.get(label);
        let index;

        if (listeners && listeners.length) {
            // 寻找当前事件在事件监听列表的位置 | Find the position of the current event in the event monitoring list
            index = listeners.reduce((i: number, listener: any, index: number) => {
                if (typeof listener.callback === "function" && listener.callback === callback && listener.vm === vm) {
                    i = index;
                }
                return i;
            }, -1);

            if (index > -1) {
                // 移除事件 | Remove event
                listeners.splice(index, 1);
                this.listeners.set(label, listeners);
                return true;
            }
        }
        return false;
    }

    /**
     * 触发监听 | Trigger monitor
     * @param label 事件名称 | Event name
     * @param args 参数 | parameter
     * @return {boolean}
     */
    emit(label: string, ...args: T[]): boolean {
        // 获取事件列表中存储的事件 | Get events stored in the event list
        const listeners = this.listeners.get(label);

        if (listeners && listeners.length) {
            listeners.forEach((listener: { callback: (...params: T[]) => void; vm: T }) => {
                // 扩展callback函数,让其拥有listener.vm中的方法 | Extend the callback function to have methods in listener.vm
                listener.callback.call(listener.vm, ...args);
            });
            return true;
        }
        return false;
    }
}

export default new Emitter();
