function getCurrentDate() {
  const currentDateObject = new Date();
  const currentDate = currentDateObject.toISOString().split("T")[0];
  return currentDate;
}

function getPunchDataEndpoint() {
  const logOnUserDetailsJsonString = localStorage.getItem("logOnUserDetails");
  const userData = JSON.parse(logOnUserDetailsJsonString);

  return `https://app.hrone.cloud/api/timeoffice/attendance/RawPunch/${
    userData.employeeId
  }/${getCurrentDate()}`;
}

let oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function () {
  const url = arguments[1];
  if (url.includes(getPunchDataEndpoint()))
    this.addEventListener("load", function () {
      const responseBody = this.responseText;

      window.postMessage(
        {
          type: "FROM_PAGE",
          data: responseBody ? JSON.parse(responseBody) : null,
        },
        "*"
      );
    });
  return oldXHROpen.apply(this, arguments);
};
