const fs = require("fs");
const pro = new Promise((r) => {
  setTimeout(() => {
    r(1233);
  }, 1233);
});
async function test() {
  const a = await pro.then((r) => {
    console.log(r);
    return r;
  });
  console.log(2333);
}

test();
