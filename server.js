/** Server startup for BizTime. */
const app = require("./app");

///////// listen on port 3000 ////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App is listening at: http://localhost:${PORT}`);
});
