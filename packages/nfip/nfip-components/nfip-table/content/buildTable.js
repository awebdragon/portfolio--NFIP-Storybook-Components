export default function (tableData) {
  return ` 
    <colgroup>
      ${Array(tableData[0].length - 1)
        .fill("<col>")
        .join("\n      ")}
    </colgroup>
    <thead>
      <tr>
        ${tableData
          .map((row) => `<th scope="col">${row[0]}</th>`)
          .join("\n        ")}
      </tr>
    </thead>
    <tbody>
        ${tableData[0]
          .map((_, index) => tableData.map((row) => row[index]))
          .slice(1)
          .map(
            (row) =>
              `<tr>${row
                .map(
                  (cell, index) =>
                    `\n        <${`td`}>${cell}</${
                      `td`
                    }>`
                )
                .join("\n          ")}</tr>`
          )
          .join("")}
    </tbody>
`;
}
