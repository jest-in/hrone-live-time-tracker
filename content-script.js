const logOnUserDetailsJsonString = localStorage.getItem("logOnUserDetails");
const userData = JSON.parse(logOnUserDetailsJsonString);
const authDetailsJsonString = localStorage.getItem("authlogin");
const authDetails = JSON.parse(authDetailsJsonString);

const today = new Date();
const todayString = today.toISOString().split("T")[0];

let punchData;
let lastPunchIn;
let totalMinutes;

function getWorkedMinutes(punchData) {
  let totalMinutes = 0;

  for (let i = 0; i < punchData.length - 1; i += 2) {
    const punchIn = new Date(punchData[i].punchDateTime);
    const punchOut = new Date(punchData[i + 1].punchDateTime);

    punchIn.setSeconds(0, 0);
    punchOut.setSeconds(0, 0);

    if (punchOut >= punchIn) {
      totalMinutes += Math.floor((punchOut - punchIn) / (1000 * 60));
    }
  }

  if (punchData.length % 2 == 1) {
    lastPunchIn = new Date(punchData[punchData.length - 1].punchDateTime);
  }

  return totalMinutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function latestTime() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function updateTime(content) {
  const timeContentElement = document.querySelector("#time span");
  timeContentElement.textContent = content;
}

function liveTime() {
  const now = latestTime();

  if (now >= lastPunchIn) {
    const time = formatTime(
      totalMinutes + Math.floor((now - lastPunchIn) / (1000 * 60))
    );
    updateTime(time);
  }
}

async function punchDataHandler(data) {
  punchData = data;
  totalMinutes = getWorkedMinutes(data);
  if (lastPunchIn) {
    const now = latestTime();
    render(
      "time",
      formatTime(totalMinutes + Math.floor((now - lastPunchIn) / (1000 * 60))),
      "live"
    );
    setInterval(liveTime, 60000);
  } else {
    render("time", formatTime(totalMinutes));
  }
}

async function fetchPunchData() {
  await fetch(
    `https://app.hrone.cloud/api/timeoffice/attendance/RawPunch/${userData.employeeId}/${todayString}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authDetails.access_token}`,
      },
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Could not fetch! ");
      }
      return response.json();
    })
    .then(punchDataHandler)
    .catch((err) => {});
}

function render(id, content, className = "") {
  let div = document.getElementById(id);
  if (!div) {
    div = document.createElement("div");
    div.id = id;
    div.className = className;
    document.body.insertBefore(div, document.body.firstChild);
    const span = document.createElement("span");
    span.innerHTML = content;
    div.appendChild(span);
    const button = document.createElement("button");
    button.innerHTML = `<img src="${chrome.runtime.getURL(
      "refresh-icon.png"
    )}" alt="icon" style="width:16px; height:16px; vertical-align:middle;">`;

    button.onclick = function () {
      fetchPunchData();
    };
    // Append the button to the div
    div.appendChild(button);
  } else {
    updateTime(content);
    div.className = className;
  }
}

render("time", "-- : --");

fetchPunchData();

const myDiv = document.getElementById("time");
let offsetX = 0,
  offsetY = 0,
  isDragging = false;

myDiv.onmousedown = function (e) {
  isDragging = true;

  const computedStyle = getComputedStyle(myDiv);
  offsetX = window.innerWidth - e.clientX - parseInt(computedStyle.right);
  offsetY = window.innerHeight - e.clientY - parseInt(computedStyle.bottom);

  document.onmousemove = function (e) {
    if (!isDragging) return;

    let newRight = window.innerWidth - e.clientX - offsetX;
    let newBottom = window.innerHeight - e.clientY - offsetY;

    // Clamp values to stay within the viewport
    const maxRight = window.innerWidth - myDiv.offsetWidth;
    const maxBottom = window.innerHeight - myDiv.offsetHeight;

    newRight = Math.min(Math.max(newRight, 0), maxRight);
    newBottom = Math.min(Math.max(newBottom, 0), maxBottom);

    myDiv.style.right = newRight + "px";
    myDiv.style.bottom = newBottom + "px";
  };

  document.onmouseup = function () {
    isDragging = false;
    document.onmousemove = null;
    document.onmouseup = null;
  };
};

// Insert a xhr response intercepting script into webpage context
var script = document.createElement("script");
script.src = chrome.runtime.getURL("xhr-response-interceptor.js");
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", function (event) {
  if (event.source !== window) return;
  if (event.data.type === "FROM_PAGE") {
    punchDataHandler(event.data.data);
  }
});
