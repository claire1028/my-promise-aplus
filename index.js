const PENDING = 'pending';
const FULFILL = 'fulfill';
const REJECT = 'reject';

function Promise(fn) {
  this.value = null;
  this.reason = null;
  this.resolves = [];
  this.rejects = [];
  this.status = PENDING;

  const resolve = (v) => {
    if(this.status === PENDING) {
      this.status = FULFILL;
      this.value = v;
      this.resolves.forEach(fn => fn(v));
    }
  }
  const reject = (r) => {
    if(this.status === PENDING) {
      this.status = REJECT;
      this.reason = r;
      this.rejects.forEach(fn => fn(r));
    }
  }
  try {
    fn(resolve, reject);
  } catch(e) {
    reject(e);
  }
}

Promise.prototype.then = function(onFulfilled, onRejected) {
  const noop = (x) => x;
  const err = (err) => {throw err;};

  onFulfilled = typeof(onFulfilled) === 'function' ? onFulfilled : noop;
  onRejected = typeof(onRejected) === 'function' ? onRejected : err;
  
  const self = this;

  const promise2 = new Promise((resolve, reject) => {
      if(self.status === FULFILL) {
        setTimeout(() => {
          try {
            const x = onFulfilled(self.value);
            resolveP(promise2, x, resolve, reject);
          } catch(e) {
            reject(e);
          }
        });
      } else if(self.status === REJECT) {
        setTimeout(() => {
          try {
            const x = onRejected(self.reason);
            resolveP(promise2, x, resolve, reject);
          } catch(e) {
            reject(e);
          }
        });
      } else if (self.status === PENDING) {
        self.resolves.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(self.value);
              resolveP(promise2, x, resolve, reject);
            } catch(e) {
              reject(e);
            }
          });
        });
        self.rejects.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(self.reason);
              resolveP(promise2, x, resolve, reject);
            } catch(e) {
              reject(e);
            }
          });
        });
      }
  });
  return promise2;
}

var resolveP = function(promise, x, resolve, reject) {
  if(promise === x) {
    reject(new TypeError('type error'));
  }

  if(x && typeof(x) === 'object' || typeof(x) === 'function') {
    let called = false;
    try {
      let then = x.then;
      if(typeof(then) === 'function') {
        then.call(x, (y) => {
          if(called) return;
          called = true;
          resolveP(promise, y, resolve, reject);
        }, (r) => {
          if(called) return;
          called = true;
          reject(r);
        });
       
      } else {
        resolve(x);
      }
    } catch(e) {
      if(called) {
        return;
      }
      reject(e);
    }
  } else {
    resolve(x);
  }
};

Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
  });
  return dfd;
};

module.exports = Promise;