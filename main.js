const SIZE = 40;

const WIDTH = 20;
const HEIGHT = 20;

const FOOD_GROWTH_AMT = 5;
let user, authCookie;

function initIdentity() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
        Cookies.set('token', token, { path: '/snake' });
        window.location.href = location.protocol + '//' + location.host + location.pathname;
    }

    if (!Cookies.get("token", { path: '/snake' })) {
        const url = encodeURIComponent(window.location.href);
        window.location.href = "https://idp.ausjan.com/api/identity?redirect_url=" + url;
    } else {
        authCookie = Cookies.get("token", { path: '/snake' });
        user = parseJwt(Cookies.get("token"));
    }
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};


const SNAKE_WIDTH = SIZE - 14;

function Snake(x, y) {
    this.body = [{ x, y }];
    this.dir = { x: 1, y: 0 }
    this.dirs = [];
    this.score = 0;
    this.increaseTailLength = 4;

    this.draw = (f) => {
        let shouldBreak = false;
        while (this.dirs.length > 0 && !shouldBreak) {
            let d = this.dirs.shift();
            if ((d.x == 0 && this.dir.x != 0) || (d.x != 0 && this.dir.x == 0) || (d.y == 0 && this.dir.y != 0) || (d.y != 0 && this.dir.y == 0)) {
                this.dir = d;
                shouldBreak = true;
            }
        }

        if (this.body[0].x == f.x && this.body[0].y == f.y) {
            this.increaseTailLength += FOOD_GROWTH_AMT;
            f.randomize(this);
        }

        if (this.body[0].x < 0 || this.body[0].y < 0 || this.body[0].x >= WIDTH || this.body[0].y >= HEIGHT) {
            return "dead";
        }
        // let setX = false;
        // let setY = false;
        // if (this.body[0].x < 0) { this.body[0].x = WIDTH; setX = true };
        // if (this.body[0].y < 0) { this.body[0].y = HEIGHT; setY = true };
        // if (!setX && this.body[0].x >= WIDTH) this.body[0].x = -1;
        // if (!setY && this.body[0].y >= HEIGHT) this.body[0].y = -1;

        for (let i = 0; i < this.body.length; i++) {
            if (this.body[0].x + this.dir.x == this.body[i].x && this.body[0].y + this.dir.y == this.body[i].y) {
                return "dead";
            }
        }

        if (this.increaseTailLength > 0) {
            this.body.push({});
            this.increaseTailLength--;
        }
        for (let i = this.body.length - 1; i >= 1; i--) {
            this.body[i].x = this.body[i - 1].x;
            this.body[i].y = this.body[i - 1].y;
        }
        this.body[0].x += this.dir.x;
        this.body[0].y += this.dir.y;

        colorMode(HSB, 100)
        for (let i = this.body.length - 1; i >= 0; i--) {
            // stroke(i * 10);
            noStroke();
            fill((i + 30) % 100, 100, 100);
            let before = i - 1 >= 0 ? this.body[i - 1] : null;
            let current = this.body[i];
            let after = i + 1 < this.body.length ? this.body[i + 1] : null;
            if (before && after) {
                if (before.x == after.x && before.x == current.x) {
                    this.drawPart("vertical", current.x, current.y);
                } else if (before.y == after.y && before.y == current.y) {
                    this.drawPart("horizontal", current.x, current.y);
                } else {
                    this.drawPart("corner" + this.detectCorner(before, current, after), current.x, current.y);
                }
            } else {
                if (!after) {
                    this.drawPart("tail" + this.detectTail(before, current), current.x, current.y);
                } else if (!before) {
                    this.drawPart("head" + this.detectTail(after, current), current.x, current.y);
                }
            }
        }
        colorMode(RGB)
        if (this.score < this.body.length) this.score++;
    }

    this.addDir = (dir) => {
        this.dirs.push(dir);
    }

    this.okFoodPos = (food) => {
        for (let i = 0; i < this.body.length; i++) {
            if (food.x == this.body[i].x && food.y == this.body[i].y) return false;
        }
        return true;
    }

    this.detectCorner = (before, current, after) => {
        const types = [
            [{ x: -1, y: 0 }, { x: 0, y: -1 }],
            [{ x: 0, y: -1 }, { x: -1, y: 0 }],
            [{ x: -1, y: 0 }, { x: 0, y: 1 }],
            [{ x: 0, y: 1 }, { x: -1, y: 0 }],
            [{ x: 1, y: 0 }, { x: 0, y: -1 }],
            [{ x: 0, y: -1 }, { x: 1, y: 0 }],
            [{ x: 0, y: 1 }, { x: 1, y: 0 }],
            [{ x: 1, y: 0 }, { x: 0, y: 1 }],
        ]
        for (let i = 0; i < types.length; i++) {
            x1 = before.x - current.x;
            y1 = before.y - current.y;
            x2 = after.x - current.x;
            y2 = after.y - current.y;
            if (x1 == types[i][0].x && y1 == types[i][0].y && x2 == types[i][1].x && y2 == types[i][1].y) {
                return floor(i / 2) + 1;
            }
        }
    }

    this.detectTail = (before, current) => {
        const types = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
        ]
        for (let i = 0; i < types.length; i++) {
            x = before.x - current.x;
            y = before.y - current.y;
            if (x == types[i].x && y == types[i].y) {
                return i + 1;
            }
        }
    }

    this.drawPart = (partType, x, y) => {
        let gap = (SIZE - SNAKE_WIDTH) / 2;
        if (partType == "horizontal") {
            rect(x * SIZE, y * SIZE + gap, SIZE, SNAKE_WIDTH);
        }
        if (partType == "vertical") {
            rect(x * SIZE + gap, y * SIZE, SNAKE_WIDTH, SIZE);
        }
        if (partType == "corner1") {
            beginShape();
            vertex(x * SIZE + gap, y * SIZE);
            vertex(x * SIZE + gap, y * SIZE + gap);
            vertex(x * SIZE, y * SIZE + gap);
            vertex(x * SIZE, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE - gap, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE - gap, y * SIZE);
            endShape(CLOSE);
        }
        if (partType == "corner2") {
            beginShape();
            vertex(x * SIZE, y * SIZE + gap);
            vertex(x * SIZE, (y + 1) * SIZE - gap);
            vertex(x * SIZE + gap, (y + 1) * SIZE - gap);
            vertex(x * SIZE + gap, (y + 1) * SIZE);
            vertex((x + 1) * SIZE - gap, (y + 1) * SIZE);
            vertex((x + 1) * SIZE - gap, y * SIZE + gap);
            endShape(CLOSE);
        }
        if (partType == "corner3") {
            beginShape();
            vertex(x * SIZE + gap, y * SIZE);
            vertex(x * SIZE + gap, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE, y * SIZE + gap);
            vertex((x + 1) * SIZE - gap, y * SIZE + gap);
            vertex((x + 1) * SIZE - gap, y * SIZE);
            endShape(CLOSE);
        }
        if (partType == "corner4") {
            beginShape();
            vertex(x * SIZE + gap, y * SIZE + gap);
            vertex((x + 1) * SIZE, y * SIZE + gap);
            vertex((x + 1) * SIZE, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE - gap, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE - gap, (y + 1) * SIZE);
            vertex(x * SIZE + gap, (y + 1) * SIZE);
            endShape(CLOSE);
        }
        if (partType == "tail1") {
            rect(x * SIZE + gap, y * SIZE, SNAKE_WIDTH, SIZE - gap);
        }
        if (partType == "tail2") {
            rect(x * SIZE + gap, y * SIZE + gap, SNAKE_WIDTH, SIZE - gap);
        }
        if (partType == "tail3") {
            rect(x * SIZE, y * SIZE + gap, SIZE - gap, SNAKE_WIDTH);
        }
        if (partType == "tail4") {
            rect(x * SIZE + gap, y * SIZE + gap, SIZE - gap, SNAKE_WIDTH);
        }

        if (partType == "head1") {
            beginShape();
            vertex(x * SIZE + gap, y * SIZE);
            vertex(x * SIZE, (y + 1) * SIZE - gap);
            vertex(x * SIZE + gap, (y + 1) * SIZE);
            vertex((x + 1) * SIZE - gap, (y + 1) * SIZE);
            vertex((x + 1) * SIZE, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE - gap, y * SIZE);
            endShape(CLOSE);
        }
        if (partType == "head2") {
            beginShape();
            vertex(x * SIZE + gap, y * SIZE);
            vertex(x * SIZE, y * SIZE + gap);
            vertex(x * SIZE + gap, (y + 1) * SIZE);
            vertex((x + 1) * SIZE - gap, (y + 1) * SIZE);
            vertex((x + 1) * SIZE, y * SIZE + gap);
            vertex((x + 1) * SIZE - gap, y * SIZE);
            endShape(CLOSE);
        }
        if (partType == "head3") {
            beginShape();
            vertex(x * SIZE, y * SIZE + gap);
            vertex((x + 1) * SIZE - gap, y * SIZE);
            vertex((x + 1) * SIZE, y * SIZE + gap);
            vertex((x + 1) * SIZE, (y + 1) * SIZE - gap);
            vertex((x + 1) * SIZE - gap, (y + 1) * SIZE);
            vertex(x * SIZE, (y + 1) * SIZE - gap);
            endShape(CLOSE);
        }
        if (partType == "head4") {
            beginShape();
            vertex(x * SIZE, y * SIZE + gap);
            vertex(x * SIZE + gap, y * SIZE);
            vertex((x + 1) * SIZE, y * SIZE + gap);
            vertex((x + 1) * SIZE, (y + 1) * SIZE - gap);
            vertex(x * SIZE + gap, (y + 1) * SIZE);
            vertex(x * SIZE, (y + 1) * SIZE - gap);
            endShape(CLOSE);
        }
    }

}

function Food() {
    this.x = floor(random(0, WIDTH));
    this.y = floor(random(0, HEIGHT));

    this.draw = () => {
        stroke(255, 0, 0);
        fill(128, 0, 0);
        rect(this.x * SIZE, this.y * SIZE, SIZE, SIZE);
    }

    this.randomize = (snake) => {
        do {
            let avaliablePoints = [];
            for (let x = 0; x < WIDTH; x++) {
                for (let y = 0; y < HEIGHT; y++) {
                    const pnt = { x, y };
                    if (snake.okFoodPos(pnt))
                        avaliablePoints.push(pnt);
                }
            }
            const r = avaliablePoints[floor(random(0, avaliablePoints.length))];
            this.x = r.x;
            this.y = r.y;
        } while (!snake.okFoodPos(this));
    }
}


let snake = new Snake(WIDTH / 2 - 7, HEIGHT / 2);
let food;
let highscore = 0;
let aiMode = false;

function setup() {
    createCanvas(SIZE * WIDTH, SIZE * HEIGHT);
    frameRate(8);
    food = new Food();
    initIdentity();
    fetch("https://pi.ausjan.com/storage/snake", {
        headers: {
            'x-auth-cookie': authCookie,
        }
    })
        .then(data => data.json())
        .then(data => {
            highscore = data.highscore;
        })
        .catch(err => console.log(err));
}

function draw() {
    background(10, 10, 10);
    food.draw();
    let state = snake.draw(food);
    if (state == "dead") {
        if (snake.score > highscore) {
            highscore = snake.score;
            fetch("https://pi.ausjan.com/storage/snake", {
                method: "POST",
                body: JSON.stringify({ highscore: snake.score }),
                headers: {
                    'x-auth-cookie': authCookie,
                    "Content-Type": 'application/json',
                }
            }).then(data => console.log(data.status)).catch(err => console.log("POST ERR:", err));
        }
        snake = new Snake(WIDTH / 2 - 7, HEIGHT / 2);
    }
    if (aiMode)
        AIMove(snake, food)
    document.getElementById("score").innerText = snake.score;
    document.getElementById("highscore").innerText = highscore;
}

function keyPressed({ key }) {
    if (key == "w" || keyCode === UP_ARROW) snake.addDir({ x: 0, y: -1 });
    if (key == "s" || keyCode === DOWN_ARROW) snake.addDir({ x: 0, y: 1 });
    if (key == "a" || keyCode === LEFT_ARROW) snake.addDir({ x: -1, y: 0 });
    if (key == "d" || keyCode === RIGHT_ARROW) snake.addDir({ x: 1, y: 0 });
    if (key == "i") {
        aiMode = !aiMode;
        if (aiMode) {
            frameRate(100);
        } else {
            frameRate(8);
        }
    }
}


function AIMove(snake, food) {
    const EVAL_DEPTH = 300;

    const addCoord = (a, b) => ({
        x: a.x + b.x,
        y: a.y + b.y,
    })
    const coordEqual = (a, b) => a.x == b.x && a.y == b.y;

    const head = snake.body[0];
    const nextHead = addCoord(head, snake.dir)
    const inSnake = ({ x, y }, body) => {
        for (let i = 0; i < body.length; i++) {
            if (x == body[i].x && y == body[i].y) {
                return true;
            }
        }
        return false;
    }
    const inWall = ({ x, y }) =>
        x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT

    const isDead = (pos, body = snake.body) => inWall(pos) || inSnake(pos, body);


    if (isDead(nextHead)) {
        let dir1;
        let dir2;
        if (snake.dir.y == 0) {
            dir1 = { x: 0, y: 1 };
            dir2 = { x: 0, y: -1 };
        } else {
            dir1 = { x: 1, y: 0 };
            dir2 = { x: -1, y: 0 };
        }
        let score1 = evalMove(cloneObjArr(snake.body), food, dir1, EVAL_DEPTH);
        let score2 = evalMove(cloneObjArr(snake.body), food, dir2, EVAL_DEPTH);
        if (score1 > score2) {
            snake.addDir(dir1);
        } else {
            snake.addDir(dir2);
        }
    } else {
        let targetDir = snake.dir;
        if (head.x == food.x && snake.dir.y == 0 || snake.dir.x == 1 && head.x > food.x || snake.dir.x == -1 && head.x < food.x) {
            targetDir = { y: food.y > head.y ? 1 : -1, x: 0 };
        }
        if (head.y == food.y && snake.dir.x == 0 || snake.dir.y == 1 && head.y > food.y || snake.dir.y == -1 && head.y < food.y) {
            targetDir = { x: food.x > head.x ? 1 : -1, y: 0 };
        }
        let score = evalMove(cloneObjArr(snake.body), food, targetDir, EVAL_DEPTH);
        if (score >= EVAL_DEPTH) {
            snake.addDir(targetDir);
        } else {
            let currentScore = evalMove(cloneObjArr(snake.body), food, snake.dir, EVAL_DEPTH);
            if (currentScore < EVAL_DEPTH) {
                let dir1;
                let dir2;
                if (snake.dir.y == 0) {
                    dir1 = { x: 0, y: 1 };
                    dir2 = { x: 0, y: -1 };
                } else {
                    dir1 = { x: 1, y: 0 };
                    dir2 = { x: -1, y: 0 };
                }
                let score1 = evalMove(cloneObjArr(snake.body), food, dir1, EVAL_DEPTH);
                let score2 = evalMove(cloneObjArr(snake.body), food, dir2, EVAL_DEPTH);
                if (currentScore < Math.max(score1, score2)) {
                    if (score1 > score2) {
                        snake.addDir(dir1);
                    } else {
                        snake.addDir(dir2);
                    }
                }
            }
        }

    }

    function evalMove(currentBody, food, currentDir, depth) {
        const { ticks, body, ateFood } = getNextSnakeState(cloneObjArr(currentBody), currentDir, food);
        if (ticks == 0) return 0;
        if (depth - ticks < 0) {
            return ticks
        };
        // console.log(currentBody, currentDir, depth, ticks)
        let dir1;
        let dir2;
        if (currentDir.y == 0) {
            dir1 = { x: 0, y: 1 };
            dir2 = { x: 0, y: -1 };
        } else {
            dir1 = { x: 1, y: 0 };
            dir2 = { x: -1, y: 0 };
        }
        let score1 = evalMove([...body], ateFood ? null : food, dir1, depth - ticks);
        let score2 = evalMove([...body], ateFood ? null : food, dir2, depth - ticks);
        return ticks + max(score1, score2);

    }

    function getNextSnakeState(body, dir, food) {
        let ticks = 0;
        let numFoodsToAdd = 0;
        let ateFood = false;
        while (true) {
            const next = addCoord(body[0], dir);
            if (isDead(next, body)) return { ticks, body, ateFood };
            if (numFoodsToAdd > 0) {
                body.push({});
                numFoodsToAdd--;
            }

            for (let i = body.length - 1; i >= 1; i--) {
                body[i].x = body[i - 1].x;
                body[i].y = body[i - 1].y;
            }
            body[0] = addCoord(body[0], dir);
            if (food && coordEqual(body[0], food)) {
                numFoodsToAdd += FOOD_GROWTH_AMT;
                ateFood = true;
            }
            ticks++;
        }
    }
}

function cloneObjArr(arr) {
    return arr.map(o => ({ ...o }));
}

