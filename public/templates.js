function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

let templateServerRow = (name, host, status) => htmlToElement(`
    <a href="javascript:void(0)" data-name="${name}" data-host="${host}" onclick="onServerItemClicked(this)"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center server-item">
        ${name}
        <small >${host}</small>
    </a>
    `);

let templateFileRow = file => htmlToElement(`
    <label class="list-group-item list-group-item-action form-check-label d-flex justify-content-between" for="${file.name}">
        <span><b>${file.name}</b> - ${file.size} - <small>last modified ${timeSince(new Date(file.date))} ago</small></span>
        <input onchange="onFileCheckChange(this)" class="form-check-input file-row-input" type="checkbox" id="${file.name}">
    </label>
    `)

let templateLogRow = log => htmlToElement(`
    <li class="list-group-item log-item">${log}</li>
    `)
