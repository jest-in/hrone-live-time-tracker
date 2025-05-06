const logOnUserDetailsJsonString = localStorage.getItem("logOnUserDetails");
const userData = JSON.parse(logOnUserDetailsJsonString);
const today = new Date();
const todayString = today.toISOString().split("T")[0];

let oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function () {
  const url = arguments[1];
  if (
    url.includes(
      `https://app.hrone.cloud/api/timeoffice/attendance/RawPunch/${userData.employeeId}/${todayString}`
    )
  )
    this.addEventListener("load", function () {
      const responseBody = this.responseText;

      window.postMessage(
        { type: "FROM_PAGE", data: JSON.parse(responseBody) },
        "*"
      );
    });
  return oldXHROpen.apply(this, arguments);
};
