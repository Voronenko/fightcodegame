/**
    * @fileOverview Asynchronous Robot stub for http://fightcodegame.com/
    * @author Vyacheslav Voronenko
    * @version 2013.04.06
    */

var Robot;
(function () {
    "use strict";
    // var console = {log: function () {}};
    var
        ticks = 0,
        MAXTICKS = 9007199254740000,//100, 
        POINT_NW = {x: 0, y: 0},
        POINT_SE = {x: null, y: null},
        droids = {},
        LastEnemyPos = null,
        LastEnemyTimeout = 0,
        patrolStrategy,
        collisionStrategy,//Wall, Robot.
        radarStrategy,  //scan, record last enemy position
        rushStrategy,//go at last enemy position fire, fire, fire
        cloneStrategy , //BOOT LOADER FOR CLONE
        masterStrategy //BOOT LOADER FOR MASTER
        ;

    //boot

    /** @scope Droid */
    cloneStrategy = {
        Idle: function () {
            console.log('CLONE:'+this.id);
            var that = this;
            that.addPlan(radarStrategy);
            that.addPlan(rushStrategy);
            delete cloneStrategy.Idle;
        }
    };

    /** @scope Droid */
    masterStrategy = {
            Idle: function () {
                console.log('MASTER:'+this.id);
                var that = this;
                that.addPlan(radarStrategy);
                that.addPlan(patrolStrategy);
                console.log('Master.init');
                delete masterStrategy.Idle;
            },
            ScannedRobot: function () {

                console.log('Master: cloning');
                this.getRobot().clone();
                this.dropPlan(patrolStrategy);
                this.rotateCannon(0);
                this.addPlan(rushStrategy);
                delete masterStrategy.ScannedRobot;
            }
        };
    ///boot

    /** @scope Droid */
  collisionStrategy = {
        WallCollision: function () {
            var that = this,
                robo = this.getRobot(),
                rotateangle = 90 - robo.angle % 90;
            that.turn(rotateangle);
        },

        RobotCollision: function (ev) {
            console.log('RobotCollision at' + ev.bearing);
            if (this.isMaster) {
                this.skip()
                    .then(this.turnAt(POINT_NW))
                    .then(this.ahead(100));
            } else {
                this.skip()
                    .then(this.turnAt(POINT_SE))
                    .then(this.ahead(100));
            }
        }
    };

    /** @scope Droid */
    patrolStrategy = {
        name: 'patrolStrategy',
        Idle: function () {
//          this.log(fmt('{{angle}} : {{cannonAbsoluteAngle}} : {{cannonRelativeAngle}}',robo));
            var that = this;
            LastEnemyTimeout++;
            if (LastEnemyPos !== null) {
                that.cannonAt(LastEnemyPos)
                    .then(
                        that.fire()
                    );
            } else {
                that.turnGunLeft(180);
            }
            that.ahead(100);
        },

        HitByBullet: function (ev) {
            console.log('HitByBullet');
            if (this.isMaster) {
                this.turnAt(POINT_NW)
                    .then(this.disappear())
                    .then(this.ahead(100))

            } else {
                this.turn(ev.bearing)
                    .then(this.fire());
            }
            this.turn(ev.bearing)
                .then(this.fire())
                .then(this.clone());
        }
    };

    /** @scope Droid */
    radarStrategy = {
        Idle: function () {
            LastEnemyTimeout++;
            if (LastEnemyTimeout > 20){
                this.turnGunLeft(360);
            }
        },

        ScannedRobot: function (ev) {
            var robo = ev.scannedRobot;
            if (this.isEnemy(robo)) {
                LastEnemyPos = robo.position;
                LastEnemyTimeout = 0;
                console.log('ENEMY: ' +robo.id+ ' at ' + LastEnemyPos.x + ':' + LastEnemyPos.y);
            } else {
                console.log('FRIEND: ' + robo.id);
            }
        }
    };

    /** @scope Droid */
    rushStrategy = {
        Idle: function () {
            var that = this;
            that.turnAt(LastEnemyPos)
                .then(that.cannonAt(LastEnemyPos, true))
                .then(that.fire())
                .then(that.turnGunLeft(10))
                .then(that.fire())
                .then(that.turnGunRight(20))
                .then(that.fire())
                .then(that.turnGunLeft(10))
                .then(that.ahead(10));
        },
        HitByBullet: function (ev) {
            this.stop().then(this.turn(ev.bearing))
                .then(this.fire());
            if (Math.abs(ev.bearing) > 10) {
                LastEnemyTimeout = MAXTICKS;
            }
        }
    };
//battle functions


    /**
     * Internal Droid class with chained method execution support
     * @constructor
     * @property id {string} Id of the robot
     * @property parentId {string} Id of the robot's parent
     * @property isMaster {boolean} readonly, whenever droid is clone
    */
    function Droid(arobot) {
        var robo = arobot;

        this.id = arobot.id;
        this.parentId = arobot.parentId;
        /**
        * @ignore
        */
        this.behaviuor = [];

        /**
          Method to update robo cache with updated information from outside world
          @param updatedRobot {ServerRobot} The id of the record to destroy.
        */
        this.setRobot = function (updatedRobot) {
            robo = updatedRobot;
            this.id = robo.id;
            this.parentId = robo.parentId;
        };

        /**
          @returns ServerRobot
        */
        this.getRobot = function () {
            return robo
        };

        this.isMaster = arobot.parentId ? false : true;
        this.behaviuor.push(collisionStrategy);
        if (this.isMaster) {
            this.behaviuor.push(masterStrategy);
        } else {
            this.behaviuor.push(cloneStrategy);
        }
        this.ahead = ahead;
        this.back = back;
        this.move = move;
        this.rotateCannon = rotateCannon;
        this.turnGunLeft = turnGunLeft;
        this.turnGunRight = turnGunRight;
        this.turn = turn;
        this.turnLeft = turnLeft;
        this.turnRight = turnRight;
        this.fire = fire;
        this.disappear = disappear;
        this.cannonAt = cannonAt;
        this.fireAt = fireAt;
        this.turnAt = turnAt;
        this.skip = skip;
        this.stop = function () {
            robo.stop();
            return skip();
        };

        /**
            Possibility to stop processing of event after some strategy
            @protected
         */
        this.stopPropagation = false;


        /**
         * Moves the given amount ahead
         * @param amount {int}
         * @returns Promise
         */
        function ahead(amount) {
            var rads = (robo.angle - 90) * (Math.PI / 180);
            var dx = amount * Math.sin(rads);
            var dy = amount * Math.cos(rads);
            robo.position.x += dx;
            robo.position.y += dy;
            if (robo.position.x < 0)robo.position.x = 0;
            if (robo.position.y < 0)robo.position.y = 0;
            return invoke("ahead", amount);
        }

        /**
         * Moves the given amount backwards
         * @param amount {int}
         * @returns Promise
         */
        function back(amount) {
            var rads = (robo.angle - 90) * (Math.PI / 180);
            var dx = amount * Math.sin(rads);
            var dy = amount * Math.cos(rads);
            robo.position.x -= dx;
            robo.position.y -= dy;
            robo.position.x = Math.min(robo.position.x, 0);
            robo.position.y = Math.min(robo.position.y, 0);
            return invoke("back", amount);
        }

        /**
         * Moves ahead if direction equals to 1, backwards otherwise
         * @param amount {int}
         * @param direction {int}
         * @returns Promise
         */
        function move(amount, direction) {
            return invoke("move", amount, direction);
        }

        /**
         * Rotates your cannon angle by the specified number of degrees
         * @param degrees {int}
         * @returns  Promise
         */
        function rotateCannon(degrees) {
           return invoke("rotateCannon", degrees);
        }

        /**
         * Rotates gun Left, if degrees < 180, or (360-degrees) right otherwise
         * @param degrees {int}
         * @returns Promise
         */
        function turnGunLeft(degrees) {
            robo.cannonAbsoluteAngle = robo.cannonAbsoluteAngle - degrees;
            return(degrees < 180) ? (invoke("turnGunLeft", degrees)) : (invoke("turnGunRight", 360 - degrees));
        }

        /**
         * Rotates gun Right, if degrees < 180, or (360-degrees) left otherwise
         * @param degrees {int}
         * @returns Promise
         */
        function turnGunRight(degrees) {
            robo.cannonAbsoluteAngle = robo.cannonAbsoluteAngle + degrees;
            return(degrees < 180) ? (invoke("turnGunRight", degrees)) : (invoke("turnGunLeft", 360 - degrees));
        }

        /**
         * Rotates droid by the specified number of degrees
         * @param degrees {int}
         * @returns Promise
         */
        function turn(degrees) {
            robo.cannonAbsoluteAngle = robo.cannonAbsoluteAngle + degrees;
            robo.angle += degrees;
            return invoke("turn", degrees);
        }

        /**
         * Rotates your robot to the left by the specified number of degrees (equivalent to turn(-1 * degrees))
         * @param degrees {int}
         * @returns {Promise}
         */
        function turnLeft(degrees) {
            robo.cannonAbsoluteAngle = robo.cannonAbsoluteAngle - degrees;
            robo.angle = robo.angle - degrees;
            return(degrees < 180) ? (invoke("turnLeft", degrees)) : (invoke("turnRight", 360 - degrees));
        }

        /**
         * Rotates your robot to the right by the specified number of degrees (equivalent to turn(1 * degrees))
         * @param degrees {int}
         * @returns {Promise}
         */
        function turnRight(degrees) {
            robo.cannonAbsoluteAngle = robo.cannonAbsoluteAngle + degrees;
            robo.angle = robo.angle + degrees;
            return(degrees < 180) ? (invoke("turnRight", degrees)) : (invoke("turnLeft", 360 - degrees));
        }

        /**
         *
         * @returns {Promise}
         */
        function fire() {
           return invoke("fire");
        }

        /**
         *
         * @returns {Promise}
         */
        function disappear() {
           return invoke("disappear");
        }

        /**
         *
         * @param position
         * @returns {Promise}
         */
        function cannonAt(position) {
            var res = null;
            var angleto = angleTo(robo.position, position);
            var normalizedangle = 180 + angleto;
            var toRotate = robo.cannonAbsoluteAngle - normalizedangle;
            if (toRotate < 0)toRotate = 360 + toRotate;
            if (toRotate >= 360)toRotate = toRotate - 360;
            if (toRotate != 0) {
                console.log('rt cnn ' + toRotate);
                 res = turnGunLeft(toRotate);
            } else {
                res = skip();
            }
            return res;
        }

        /**
         * Turns tank to position coordinate
         * @param position
         * @returns {Promise}
         */
        function turnAt(position) {
            var angleto = angleTo(robo.position, position);
            var normalizedangle = 180 + angleto;
            var normalizedrobotangle = roboAngleToCannon(robo.angle);
            var toRotate = normalizedrobotangle - normalizedangle;
            if (toRotate < 0)toRotate = 360 + toRotate;
            if (toRotate >= 360)toRotate = toRotate - 360;
            if (toRotate != 0) {
                console.log('rt trn ' + toRotate);
                return turnLeft(toRotate);
            } else {
                return skip();
            }
        }

        /** @scope Droid */
        function fireAt(position) {
          return this.cannonAt(position).then(fire());
        }

        /**
         *
         * @param action
         * @param param1
         * @returns {Promise}
         */
        function invoke(action, param1, param2) {
            var promise = new Promise(this);
            robo[action](param1, param2);
            robo.notify(function () {
                promise.resolve();
            });
            return promise;
        }

        function skip() {
            var promise = new Promise(this);
            setTimeout(function () {
                promise.resolve();
            }, 0);
            return promise;
        }
    }

    /**
     * Drops strategy pattern fromDroid
     * @param strategy
     */
    Droid.prototype.dropPlan = function (strategy) {
        dropElement(this.behaviuor, strategy);
    };


    /**
     * Adds strategy pattern to Droid
     * @param strategy
     */
    Droid.prototype.addPlan = function (strategy) {
        this.behaviuor.push(strategy);
    };

    /**
     *
     * @param handler {string} Idle|ScannedRobot|WallCollision|RobotCollision|HitByBullet
     * @param ev
     */
    Droid.prototype.processTurn = function (handler, ev) {
        var that = this;
        that.stopPropagation = false;
        that.behaviuor.forEach(function (item) {
            if (that.stopPropagation) {
                return;
            }
            if (item[handler]) {
                item[handler].call(that, ev);
            }
        });
    };

    /**
     * Checks if robot is enemy
     * @param who {ServerRobot}
     * @returns {boolean}
     */
    Droid.prototype.isEnemy = function (who) {
       // console.log(this.id+':'+this.parentId+'#'+who.id+who.parentId);
        if (this.isMaster) {
            return(who.parentId != this.id)
        } else {
            return(who.id != this.parentId)
        }
    };

    /**
    * Driver to communicate with outside world
    * @constructor
    * @param robot {ServerRobot}
    */
    Robot = function (robot) {
        POINT_SE.x = robot.arenaWidth;
        POINT_SE.y = robot.arenaHeight;
    };

    Robot.prototype.processTurn = function (handler, ev) {
        droids[ev.robot.id].setRobot(ev.robot);
        droids[ev.robot.id].processTurn(handler, ev);
    };
    Robot.prototype.onIdle = function (ev) {
        ticks++;
        if (ticks > MAXTICKS)return;
        if (typeof droids[ev.robot.id] == 'undefined') {
            console.log('PREVIOUSLY NOT KNOWN DROID '+ ev.robot.id);
            droids[ev.robot.id] = new Droid(ev.robot);
        }
        this.processTurn('Idle', ev);
    };
    Robot.prototype.onWallCollision = function (ev) {
        ev.robot.stop();
        this.processTurn('WallCollision', ev);
    };
    Robot.prototype.onRobotCollision = function (ev) {
        this.processTurn('RobotCollision', ev);
    };
    Robot.prototype.onScannedRobot = function (ev) {
        this.processTurn('ScannedRobot', ev);
    };
    Robot.prototype.onHitByBullet = function (ev) {
        this.processTurn('HitByBullet', ev);
    };

    /**
     * Converts angle of the robot to cannon angle
     * @param roboangle
     * @returns {number}
     */
    function roboAngleToCannon(roboangle) {
        return roboangle + 90;
    }

    /**
     * Converts radians to degrees (4 decimals PI)
     * @param rads
     * @returns {number}
     */
    function rad2deg(rads) {
        return Math.floor(rads * (180 / 3.1459));
    }

    /**
     *
     * @param r {Point} start point (your tank)
     * @param e {Point} ending point (enemy tank)
     * @returns {number} degrees
     */
    function angleTo(r, e) {
        var dx = e.x - r.x;
        var dy = e.y - r.y;
        var rads = Math.atan2(dy, dx);
        return rad2deg(rads);
    }

    /**
     *
     * @param r {Point} start point (your tank)
     * @param e {Point} ending point (enemy tank)
     * @returns {number} distance between r and e points
     */

    function distance(r, e) {
        var dx2 = Math.pow(e.x - r.x, 2);
        var dy2 = Math.pow(e.y - r.y, 2);
        return Math.sqrt(dx2 + dy2);
    }

    /**
     * removes elements passed as 2nd, 3rd elements from the array
     * @param arr {Array}
     * @returns {Array}
     */
    function dropElement(arr) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while ((ax = arr.indexOf(what)) !== -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    }

    /**
     * Debug routine. Allows processing object subproperties
     * fmt('Angle {{ev.bearing}} collidedRobot:{{ev.collidedRobot.id}}')
     * @param tmpl
     * @param repls
     * @returns {string}
     */
    function fmt(tmpl, repls) {
        var errors;
        return tmpl.replace(/(?:\{\{|\%7B\%7B)(.*?)(?:\}\}|\%7D\%7D)/g, function (m) {
            return getPropertyFromVar(repls, m, errors);
        });
    }

    /**
     *
     * @param obj object to dig in
     * @param m what property to dig
     * @param errors - for debug
     * @returns {*} digged property value
     */
    function getPropertyFromVar(obj, m, errors) {
        var ret;
        var localobj = obj;
        var props = m.match(/(?:\{\{|%7B%7B)(.*?)(?:\}\}|%7D%7D)/);
        if (props) {
            var proppath = props[1].split(".");
            for (var i = 0; i < proppath.length; i++) {
                localobj = localobj[proppath[i]];
                if (typeof(localobj[proppath[i]]) != "undefined")break;
            }
            ret = (localobj) ? ((localobj.content) ? localobj.content : localobj) : ((errors) ? "No value for '" + props[1] + "' (" + m + ")" : "");
        } else {
            ret = (errors) ? "No key in '" + m + "'" : "";
        }
        return ret;
    }

    /**
    * The basic implementation of the Promise pattern
    * @constructor
    */
    function Promise(promise) {
        if (promise instanceof Promise) {
            return promise;
        }
        this.callbacks = [];
        return this;
    }

    Promise.prototype.then = function (callback_ok, callback_error) {
        this.callbacks.push({ok: callback_ok, error: callback_error});
        return this;
    };
    Promise.prototype.resolve = function () {
        var callback = this.callbacks.shift();
        if (callback && callback.ok && ( typeof callback.ok == 'function' )) {
            callback.ok.apply(this, arguments);
        }
    };
    Promise.prototype.reject = function () {
        var callback = this.callbacks.shift();
        if (callback && callback.error && ( typeof callback.error == 'function' )) {
            callback.error.apply(this, arguments);
        }
    };

})();
