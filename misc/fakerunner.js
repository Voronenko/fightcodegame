//stub, just to get rid of 'not used' IDEA warnings
function Point(){
    this.x=0;
    this.y=0;
}

var fakerobot = new Robot();
fakerobot.onIdle();
fakerobot.onWallCollision();
fakerobot.onScannedRobot();
fakerobot.onHitByBullet();
fakerobot.onRobotCollision();


var fakedroid = new Droid();
droid.start();
droid.fireAt({x:0,y:0});

var promise = new Promise;
promise.reject();
promise.resolve();
promise.then();

dropElement([12],12);

var res = distance();