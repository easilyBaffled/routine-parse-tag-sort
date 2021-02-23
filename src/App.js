import React, { useReducer } from "react";
import ReactMarkdown from "react-markdown";
import memoize from "lodash/memoize";
import moment from "moment";
import l from "./list.md";
import "./styles.scss";

const keys = ["now", "soon", "decay", "eventually"];

const reduceList = ({ i, list }, { type, newIndex }) => {
  if (type === "setIndex") return { list, i: newIndex };
  if (!type) return { list, i };
  const nextState = {
    i: i + 1,
    list: [...list.slice(0, i), `#${type} ${list[i]}`, ...list.slice(i + 1)]
  };
  localStorage.setItem("list", JSON.stringify(nextState));

  return nextState;
};

export default function App() {
  const [{ list, i }, dispatch] = useReducer(reduceList, {
    i: 0,
    list: l.split("\n")
  });

  return (
    <div className="App">
      <ReactMarkdown>{list[i]}</ReactMarkdown>
      <input
        type="text"
        autoFocus
        onKeyUp={({ key }) => dispatch({ type: keys[key - 1] })}
      />
      <pre>
        {keys.map((s, i) => [
          <code key={i}>
            {i + 1}: {s}
          </code>,
          <br />
        ])}
      </pre>
      <div className="task-list">
        {list.map((s, li) => (
          <span
            key={li}
            onClick={() => dispatch({ type: "setIndex", newIndex: li })}
          >
            <ReactMarkdown className={`task ${li === i ? "current" : ""}`}>
              {s}
            </ReactMarkdown>
          </span>
        ))}
      </div>
    </div>
  );
}

let fn = (strings, ...exp) => {
  let str = strings.reduce((acc, part, i) => acc + exp[i - 1] + part);
  const args = str.match(/(\$\d)/g);
  return new Function(...args, "return " + str);
};

const subject = [
  "misc",
  "kart",
  "~",
  "routine",
  "points",
  "ally",
  "wrk",
  "health",
  "home"
];
const deadline = ["eventually", "~", "soon", "~", "decay", "now"];
const req = ["want", "~", "need", "~", "~", "owe"];

const weights = {
  ...req.reduce((acc, k, i) => ((acc[k] = i), acc), {}),
  ...deadline.reduce((acc, k, i) => ((acc[k] = i), acc), {}),
  ...subject.reduce((acc, k, i) => ((acc[k] = i), acc), {})
};

console.log(weights);

const evalTask = memoize((taskStr) => ({
  subject: subject.findIndex((s) => taskStr.includes(s)),
  deadline: deadline.findIndex((s) => taskStr.includes(s)),
  req: req.findIndex((s) => taskStr.includes(s))
}));

const getDateTag = (taskStr) =>
  taskStr.match(/#(?<date>\d+\/\d+)/)?.groups?.date;

const weightedEval = memoize(
  (taskStr) =>
    (weights[subject.find((s) => taskStr.includes(s))] ?? 0) +
    (weights[deadline.find((s) => taskStr.includes(s))] ?? 0) +
    (weights[req.find((s) => taskStr.includes(s))] ?? 0) +
    moment().diff(getDateTag(taskStr) + "/" + moment().year(), "days")
);

const weightedBasicSort = (a, b) => weightedEval(b) - weightedEval(a);

const basicSort = (a, b) =>
  Object.values(evalTask(b)).reduce(fn`$1 + $2`) -
  Object.values(evalTask(a)).reduce(fn`$1 + $2`);

const byPropSort = (a, b) =>
  evalTask(a).subject - evalTask(b).subject ||
  evalTask(a).req - evalTask(b).req ||
  evalTask(a).deadline - evalTask(b).deadline;

const sortTasks = (taskList) =>
  taskList.filter((v) => v).sort(weightedBasicSort);
// .map(
//   (taskStr) =>
//     `${taskStr} -- ${weightedEval(taskStr)} -- ${deadline.find((s) =>
//       taskStr.includes(s)
//     )}: ${
//       weights[deadline.find((s) => taskStr.includes(s))]
//     }, ${req.find((s) => taskStr.includes(s))}: ${
//       weights[req.find((s) => taskStr.includes(s))]
//     }, ${subject.find((s) => taskStr.includes(s))}: ${
//       weights[subject.find((s) => taskStr.includes(s))]
//     }`
// );

console.log(
  sortTasks(l.split("\n")).join("\n") +
    `\n\n${moment().format("MM/DD")} - **${l.split("\n").length}**`
);
