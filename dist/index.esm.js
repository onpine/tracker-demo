var TrackerConfig;
(function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
})(TrackerConfig || (TrackerConfig = {}));

const createHistoryEvent = (type) => {
    const origin = history[type];
    return function () {
        const res = origin.apply(this, arguments);
        var e = new Event(type);
        window.dispatchEvent(e);
        return res;
    };
};

const MouseEventList = [
    "click",
    "dblclick",
    "contextmenu",
    "mousedown",
    "mouseup",
    "mouseenter",
    "mouseout",
    "mouseover",
];
class Tracker {
    constructor(options) {
        this.captureEvents = (MouseEventList, targetKey, data) => {
            MouseEventList.forEach((event) => {
                window.addEventListener(event, () => {
                    this.reportTracker({
                        event,
                        targetKey,
                        data,
                    });
                });
            });
        };
        this.data = Object.assign(this.initDef(), options);
        this.installInnerTrack();
    }
    initDef() {
        window.history.pushState = createHistoryEvent("pushState");
        window.history.replaceState = createHistoryEvent("replaceState");
        return {
            sdkVersion: TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false,
        };
    }
    setUserId(uuid) {
        this.data.uuid = uuid;
    }
    setExtra(extra) {
        this.data.extra = extra;
    }
    sendTracker(data) {
        this.reportTracker(data);
    }
    installInnerTrack() {
        if (this.data.historyTracker) {
            this.captureEvents(["pushState", "replaceState"], "history-pv");
        }
        if (this.data.hashTracker) {
            this.captureEvents(["hashchange"], "hash-pv");
        }
        if (this.data.domTracker) {
            this.targetKeyReport();
        }
        if (this.data.jsError) {
            this.jsError();
        }
    }
    targetKeyReport() {
        MouseEventList.forEach((event) => {
            window.addEventListener(event, (e) => {
                const target = e.target;
                const targetValue = target.getAttribute("target-key");
                if (targetValue) {
                    this.sendTracker({
                        event,
                        targetKey: targetValue,
                    });
                }
            });
        });
    }
    jsError() {
        this.errorEvent();
        this.promiseReject();
    }
    errorEvent() {
        window.addEventListener("error", (e) => {
            this.sendTracker({
                targetKey: "message",
                event: "error",
                message: e.message,
            });
        });
    }
    promiseReject() {
        window.addEventListener("unhandledrejection", (event) => {
            event.promise.catch((error) => {
                this.sendTracker({
                    targetKey: "reject",
                    event: "promise",
                    message: error,
                });
            });
        });
    }
    reportTracker(data) {
        const params = Object.assign(this.data, data, {
            time: new Date().getTime(),
        });
        const headers = {
            type: "application/x-www-form-urlencoded",
        };
        let blob = new Blob([JSON.stringify(params)], headers);
        // navigator.sendBeacon(this.data.requestUrl, blob);
        console.log(params, blob);
    }
}

export { Tracker as default };
