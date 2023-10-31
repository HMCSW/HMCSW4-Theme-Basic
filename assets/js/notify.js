;(function ($) {
    "use strict"

    function Notification(props) {
        // see https://getbootstrap.com/docs/4.0/components/alerts/
        this.props = {
            body: "", // put here the text, shown
            type: "primary", // the appearance
            duration: 5500, // duration till auto-hide, set to `0` to disable auto-hide
            maxWidth: "520px", // the notification maxWidth
            minWidth: "320px", // the notification minWidth
            shadow: "0 2px 6px rgba(0,0,0,0.2)", // the box-shadow
            zIndex: 100,
            margin: "6rem", // the margin (above maxWidth)
            direction: "prepend" // or "append", the stack direction
        }
        this.containerId = "bootstrap-show-notification-container"
        for (let prop in props) {
            // noinspection JSUnfilteredForInLoop
            this.props[prop] = props[prop]
        }
        const cssClass = "alert d-flex alert-" + this.props.type + " alert-dismissible fade show"
        this.id = "id-" + Math.random().toString(36).substr(2)
        this.template =
            "<div class='" + cssClass + "' role='alert'>" + this.props.body +
            " <button type='button' class='btn-close' data-bs-dismiss='alert' aria-label='Close'></button>" +
            "</div>"

        this.$container = $("#" + this.containerId)
        if (!this.$container.length) {
            this.$container = $("<div id='" + this.containerId + "'></div>")
            $(document.body).append(this.$container)
            const css = "#" + this.containerId + " {" +
                "position: fixed;" +
                "right: 0rem;" +
                "top: " + this.props.margin + ";" +
                "margin-left: " + this.props.margin + ";" +
                "z-index: " + this.props.zIndex + ";" +
                "}" +
                "#" + this.containerId + " .alert {" +
                "box-shadow: " + this.props.shadow + ";" +
                "max-width: " + this.props.maxWidth + ";" +
                "min-width: " + this.props.minWidth + ";" +
                "float: right; clear: right;" +
                "}" +
                "@media screen and (max-width: " + this.props.maxWidth + ") {" +
                "#" + this.containerId + " {min-width: 0; max-width: 100%; width: 100%; right: 0; top: 95px;}" +
                "#" + this.containerId + " .alert {min-width: 0; margin-bottom: 0.25rem;width: auto;float: none;}" +
                "}"
            const head = document.head || document.getElementsByTagName('head')[0]
            const style = document.createElement('style')
            head.appendChild(style)
            style.appendChild(document.createTextNode(css))
        }
        this.$element = this.showNotification()
    }
    Notification.prototype.showNotification = function () {
        const $notification = $(this.template)
        if (this.props.direction === "prepend") {
            this.$container.prepend($notification)
        } else {
            this.$container.append($notification)
        }
        $notification.addClass("show")
        if(this.props.duration) {
            setTimeout(function () {
                $notification.alert("close")
            }, this.props.duration)
        }
        return $notification
    }
    $.extend({
        showNotification: function (props) {
            return new Notification(props)
        }
    })
}(jQuery))