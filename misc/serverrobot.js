//stub, just to get rid of  IDE warnings &  get minimal code completion in IDE
function ServerRobot() {
    this.id = 'id';
    this.angle = 12;
    // Current angle from your cannon
    this.cannonRelativeAngle = 12;
     // relative to your robot
    this.cannonAbsoluteAngle = 12;
                              // relative to the board
    this.position = {
        x:12,                 // X position in the board from your robot
        y:12                  // Y position in the board from your robot
    };

  // Percentage of the life from your robot
    this.life = 12;

  // Time remaining in the cooldown from your
    this.gunCoolDownTime = 12;


  // Number of available clones you can use
    this.availableClones = 1;

// Number of available disappears you can use
    this.availableDisappears = 1;

// In the case of being a clone, the id from your parent element. null otherwise
    this.parentId = 'id';

// Width from the board
    this.arenaWidth = 12;

// Height from the board
    this.arenaHeight = 12;





    // Moves the given amount ahead
    this.ahead = function (amount) {
    };

    // Rotates your cannon angle by the specified number of degrees
    this.rotateCannon = function (amount) {
    };

    // Fires your cannon. This functin has a cooldown before you can
    // use it again.
    this.fire = function () {
    };

// Rotates your robot the by the specified number of degrees
    this.turn = function (degrees) {
    };

    // Clones your robot into another robot and can only be used once
    // per fight. Remember to check the parentId property to stop
    // your clone from shooting you.
    this.clone = function () {
    };

     // Subscribe to get notified whenever this action gets called
        // in the queue.
     this.notify = function(callback){

     }

}

