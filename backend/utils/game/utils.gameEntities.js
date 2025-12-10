var ECollision;
(function (ECollision) {
    ECollision[ECollision["NONE"] = 0] = "NONE";
    ECollision[ECollision["FACE"] = 1] = "FACE";
    ECollision[ECollision["EDGE"] = 2] = "EDGE";
})(ECollision || (ECollision = {}));

//	Ball class
export class Ball {
    position;
    velocity;
    radius;
    speed;
    constructor(ballX, ballY, radius, speed) {
        this.position = {
            x: ballX,
            y: ballY
        };
        this.velocity = {
            x: 0,
            y: 0
        };
        this.radius = radius;
        this.speed = speed;
        this.setRandomVelocity();
    }
    setRandomVelocity() {
        const toLeft = Math.random() < 0.5;
        if (toLeft) {
            const minAngle = Math.PI * 3 / 4;
            const maxAngle = Math.PI * 5 / 4;
            const angle = minAngle + Math.random() * (maxAngle - minAngle);
            this.velocity = {
                x: Math.cos(angle) * this.speed,
                y: Math.sin(angle) * this.speed
            };
        }
        else {
            const minAngle = -Math.PI / 4;
            const maxAngle = Math.PI / 4;
            const angle = minAngle + Math.random() * (maxAngle - minAngle);
            this.velocity = {
                x: Math.cos(angle) * this.speed,
                y: Math.sin(angle) * this.speed
            };
        }
    }
    update(canvasHeight) {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.position.y - this.radius <= 0) {
            this.position.y = this.radius;
            this.reverseY();
        }
        if (this.position.y + this.radius >= canvasHeight) {
            this.position.y = canvasHeight - this.radius;
            this.reverseY();
        }
    }
    checkCollision(paddle) {
        const paddleCenter = paddle.getCenter();
        const dx = Math.abs(this.position.x - paddleCenter.x);
        const dy = Math.abs(this.position.y - paddleCenter.y);
        const collision = (dx <= paddle.getHalfW() + this.radius && dy <= paddle.getHalfH() + this.radius);
        if (!collision)
            return ECollision.NONE;
        const penX = (paddle.getHalfW() + this.radius - dx);
        const penY = (paddle.getHalfH() + this.radius - dy);
        const CORNER_THRESHOLD = 5;
        if (penX <= penY || (penX < CORNER_THRESHOLD && penY < CORNER_THRESHOLD))
            return ECollision.FACE;
        else
            return ECollision.EDGE;
    }
    collision(paddle) {
        const collision = this.checkCollision(paddle);
        if (collision === ECollision.FACE) {
            this.reverseX();
            const paddleCenter = paddle.getCenter();
            const hitOffset = this.position.y - paddleCenter.y;
            const SPIN_FACTOR = 0.03;
            const positionSpin = hitOffset * SPIN_FACTOR;
            const randomSpin = (Math.random() - 0.5) * 0.3;
            this.velocity.y += positionSpin + randomSpin;
            const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            this.velocity.x = (this.velocity.x / currentSpeed) * this.speed;
            this.velocity.y = (this.velocity.y / currentSpeed) * this.speed;
        }
        else if (collision === ECollision.EDGE) {
            this.reverseX();
            this.reverseY();
        }
        else {
            return;
        }
    }
    reverseX() {
        this.velocity.x *= -1;
    }
    reverseY() {
        this.velocity.y *= -1;
    }
    reset(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.setRandomVelocity();
    }
}

//	Paddle class
export class Paddle {
    ACCELERATION = 0.4;
    FRICTION = 0.85;
    MIN_VELOCITY = 0.1;
    position;
    width;
    height;
    speed;
    score;
    velocity;
    constructor(paddleX, paddleY, width, height, speed) {
        this.position = {
            x: paddleX,
            y: paddleY
        };
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.score = 0;
        this.velocity = 0;
    }
    moveUp() {
        this.velocity -= this.ACCELERATION;
        if (this.velocity < -this.speed)
            this.velocity = -this.speed;
    }
    moveDown() {
        this.velocity += this.ACCELERATION;
        if (this.velocity > this.speed)
            this.velocity = this.speed;
    }
    stop() {
        this.velocity *= this.FRICTION;
        if (Math.abs(this.velocity) < this.MIN_VELOCITY)
            this.velocity = 0;
    }
    update(canvasHeight) {
        const EDGE_PADDING = 5;
        this.position.y += this.velocity;
        if (this.position.y < EDGE_PADDING) {
            this.position.y = EDGE_PADDING;
            this.velocity = 0;
        }
        if (this.position.y + this.height > canvasHeight - EDGE_PADDING) {
            this.position.y = canvasHeight - this.height - EDGE_PADDING;
            this.velocity = 0;
        }
    }
    getHalfW() {
        return (this.width / 2);
    }
    getHalfH() {
        return (this.height / 2);
    }
    getCenter() {
        return ({
            x: this.position.x + this.getHalfW(),
            y: this.position.y + this.getHalfH()
        });
    }
    //	WEBSOCKET PADDLE
    applyInput(direction) {
        if (direction === "up")
            this.moveUp();
        else if (direction === "down")
            this.moveDown();
        else
            this.stop();
    }
}

//	Player class
export class Player {
    id;
    name;
    userId;
    socket;
    side;
    currentInput;
    constructor(socket, name, userId = null) {
        this.id = this.generateId();
        this.name = name;
        this.userId = userId;
        this.socket = socket;
        this.side = null;
        this.currentInput = "stop";
    }
    generateId() {
        return Math.random().toString(36).substring(2, 11);
    }
    send(message) {
        if (this.socket.readyState === this.socket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
    setInput(direction) {
        this.currentInput = direction;
    }
}
