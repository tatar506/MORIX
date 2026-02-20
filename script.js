// Автоматическое превращение ссылок в медиа
function formatMessage(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, function(url) {
        if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            return `<img src="${url}" class="chat-img" onclick="window.open('${url}')">`;
        }
        if (url.match(/\.(mp4|webm)$/) != null) {
            return `<video src="${url}" controls class="chat-video"></video>`;
        }
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

// Поиск пользователей по базе
async function searchUsers() {
    const query = document.getElementById('user-search').value;
    const resultsBox = document.getElementById('search-results');
    
    if (query.length < 2) {
        resultsBox.classList.add('hidden');
        return;
    }

    const res = await fetch(`${SERVER_URL}/search/${query}`);
    const users = await res.json();

    resultsBox.innerHTML = '';
    users.forEach(user => {
        if (user.username === currentUser) return;
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerText = '@' + user.username;
        div.onclick = () => startPrivateChat(user.username);
        resultsBox.appendChild(div);
    });
    resultsBox.classList.remove('hidden');
}

// Создание группы
async function createGroup() {
    const name = prompt("Название группы:");
    if (!name) return;

    await fetch(`${SERVER_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, creator: currentUser })
    });
    loadGroups();
}

// Блокировка (локальное удаление)
function blockUser() {
    if (confirm("Удалить этот чат и заблокировать пользователя?")) {
        const target = document.getElementById('header-name').innerText;
        localStorage.setItem(`blocked_${target}`, 'true');
        location.reload(); 
    }
}
