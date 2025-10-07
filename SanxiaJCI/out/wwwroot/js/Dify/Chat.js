// Server
const apiBaseUrl = "https://api.dify.ai";
// API 設定
const apiKey = "Bearer app-7DyEhpp2JpY3srB1f327QQzT";

// for Dify and GhatGPT Messenger
const chatButton = document.getElementById('chatButton');
const chatWindow = document.getElementById('chatWindow');
const chatDialog = document.getElementById('chatDialog');
const chatMessages = document.getElementById('chatMessages');
const typingIndicator = document.getElementById('typingIndicator');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('sendButton');
const closeButton = document.getElementById('closeButton');


if (chatButton != null) {
    chatButton.addEventListener('click', () => {
        chatWindow.classList.add('show');
        chatDialog.classList.remove('modal-slide-out');
        chatDialog.classList.add('modal-slide-in');
        chatWindow.style.display = 'block';

        if (chatMessages.childElementCount === 0) {
            const returnMessage = {
                sender: '人格導師',
                text: `你好，我是你的 AI 對話夥伴 🐾。根據你的測驗結果（例如：ENTP - 猴子 🐒），我可以幫助你探索以下三個面向：\n\n1️⃣ 依照你的個性，給出創業或職涯發展建議。\n2️⃣ 協助解析你在人際與職場中的常見困境。\n3️⃣ 根據你的領導風格，推薦適合的管理策略與合作對象。\n\n請問你想從哪個方向開始呢？`,
                buttons: [
                    {
                        type: 'extend',
                        value: [
                            { label: '創業建議', content: '我想知道我的人格適合創業嗎？' },
                            { label: '工作困境', content: '我在人際合作中常卡關，怎麼辦？' },
                            { label: '領導風格', content: '我適合哪種管理方式？' }
                        ]
                    }
                ]
            }
            setTimeout(() => { addMessage(returnMessage, false); }, 500);
        }
    });

    closeButton.addEventListener('click', () => {
        chatDialog.classList.remove('modal-slide-in');
        chatDialog.classList.add('modal-slide-out');
        setTimeout(() => {
            chatWindow.classList.remove('show');
            chatWindow.style.display = 'none';
        }, 500);
    });
}

sendButton.addEventListener('click', processMessage);


// 定義前贅詞與對應模式的處理邏輯
const modeHandlers = {
    "@system": handleSystemMode,
    "@debug": handleDebugMode,
    "@admin": handleAdminMode,
    "default": sendMessage // 預設處理普通用戶模式
};

// 處理訊息的核心函數
function processMessage() {
    showTypingIndicator();
    const message = $('#message').val();
    //var message = messageInput.innerText;
    if (message === '') {
        addMessage({ sender: 'Rob', text: `請輸入您的問題`, buttons: [] }, false);
        hideTypingIndicator();
        return;
    }

    // 從訊息中提取前贅詞
    const words = message.split(" ");
    const prefix = words[0]; // 假設前贅詞為第一個單字

    // 判斷前贅詞是否有對應的處理邏輯
    const handler = modeHandlers[prefix] || modeHandlers["default"];
    handler(message); // 呼叫對應處理函數
    $('#message').val("");
}

//普通用戶操作: 傳送訊息
async function sendMessage(message) {
    checkDateStamp(); // 假設這是同步函式
    addMessage({ sender: '你', text: message, buttons: [] }, true);

    const chatApiUrl = `${window.location.origin}/PageView/ChatGPTResponse`;

    // 使用 setTimeout 包裝成 Promise
    await new Promise(resolve => setTimeout(resolve, 1000)); // 延遲 1 秒

    //組合成使用者資訊與問題
    var payload = validateFormAndGetPayload(message);
    if (!payload) {
        messageInput.value = message;
        return; // 驗證未通過，停止後續動作
    }

    // ✅ 隱藏表單
    document.getElementById("userInfoForm").style.display = "none";
    payload.question = message;
    try {
        var host = apiBaseUrl;
        const response = await $.ajax({
            url: apiBaseUrl + '/v1/chat-messages',
            type: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                "inputs": {
                    "name": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBJZCI6IlpBNDk3MSIsImVtcE5hbWUiOiLnp6boi7Hlk7IiLCJlbXBSb2xlIjoiW3tcIlJvbGVOYW1lXCI6XCJcXHU2RDNFXFx1NURFNVxcdTY3MDBcXHU5QUQ4XFx1NkIwQVxcdTk2NTBcIixcIkVtcElkXCI6XCJaQTQ5NzFcIixcIkVtcE5hbWVcIjpcIlxcdTc5RTZcXHU4MkYxXFx1NTRGMlwiLFwiRGl2Q29kZVwiOlwiR0E5MDFcIixcIlVzZXJTeXNSb2xlU3RhdHVzXCI6MTB9LHtcIlJvbGVOYW1lXCI6XCJcXHU3MzRFXFx1OTFEMVxcdTdDRkJcXHU3RDcxXFx1N0JBMVxcdTc0MDZcXHU4MDA1XCIsXCJFbXBJZFwiOlwiWkE0OTcxXCIsXCJFbXBOYW1lXCI6XCJcXHU3OUU2XFx1ODJGMVxcdTU0RjJcIixcIkRpdkNvZGVcIjpcIkdBOTAxXCIsXCJVc2VyU3lzUm9sZVN0YXR1c1wiOjEwfV0iLCJleHAiOjE3MzQ0MjE4MTQsImlzcyI6IklDVERpc3BhdGNoIiwiYXVkIjoiSG9uZ2h3YUQifQ.Vr0II0pMcbsnMDqGGNA4Pg2nHN4H6WQNlGvpHMCaMNo" // 省略
                },
                "query": payload, // 使用者提問的問題
                "response_mode": "blocking",
                "conversation_id": "",
                "user": "abc-124"
            }),
            success: function (response) {
                if (response) {
                    addNormalMesage(
                        {
                            sender: 'Rob',
                            text: `${response.answer}`,
                            buttons: [
                                {
                                    type: 'extend',
                                    value: [
                                        {
                                            label: '嘗試重新提問。',
                                            content: message
                                        }]
                                }]
                        }, false);
                } else {
                    addMessage({ sender: 'Rob', text: `回傳資料遺失，請聯繫後端系統管理員。`, buttons: [] }, false);
                }
            },
            error: function (xhr, status, error) {
                // 檢查 readyState 和狀態碼
                console.log("Ajax 錯誤發生：", {
                    readyState: xhr.readyState,   // 請求的狀態
                    status: xhr.status,           // HTTP 狀態碼
                    statusText: xhr.statusText,   // HTTP 狀態描述
                    responseText: xhr.responseText || '無回應內容', // 回應內容
                    errorThrown: error,           // 錯誤描述
                    statusInfo: status            // 狀態（如 "error"）
                });

                // 顯示更詳細的錯誤資訊
                let errorMsg = `
                    【錯誤資訊】
                    狀態碼: ${xhr.status || '未知'} (${xhr.statusText || '未知'})\n
                    回應內容: ${xhr.responseText || '無回應內容'}\n
                    錯誤描述: ${error || '未知錯誤'}
                `;

                if (xhr.readyState === 0) {
                    errorMsg = '無法與伺服器建立連接，請檢查網絡或伺服器狀態。';
                } else if (xhr.status === 0) {
                    errorMsg = '請求被取消，可能是網絡問題或伺服器無回應。';
                }

                addMessage({ sender: 'Rob', text: `Rob發生錯誤，請重新嘗試，或連繫系統管理員。\n${errorMsg}`, buttons: [] }, false);
            }
        });
    } catch (error) {
        addMessage({ sender: 'Rob', text: `Rob發生錯誤，請重新嘗試，或連繫系統管理員。`, buttons: [] }, false);
    } finally {
        hideTypingIndicator(); // 無論成功或失敗，都隱藏輸入指示器
    }
}

//系統管理者操作: 系統操作
async function handleSystemMode(message) {

    // 執行系統操作，發送到後端 API
    var apiUrl = '';
    const method = 'GET';
    const methodText = '系統操作';

    const system_word = message.split(" ");

    addMessage({ sender: '你', text: message, buttons: [] }, true);

    var systemAction = message.replace("@system", "").trim().toLowerCase(); // 移除前贅詞
    if (systemAction !== '') {
        systemAction = system_word[1].trim().toLowerCase(); // 移除前贅詞
    }

    switch (systemAction) {
        case "knowledge_list":
            apiUrl = apiBaseUrl + `/v1/datasets?page=1&limit=20 `;
            break;
        case "knowledge_document_list":
            apiUrl = apiBaseUrl + `/v1/datasets/${system_word[2]}/documents`;
            break;
        default:
            const returnMessage = {
                sender: 'Rob',
                text: '請依照系統指令操作:',
                buttons: [
                    { type: 'extend', value: [{ label: '查找知識庫', content: '@system Knowledge_list' }] },
                    { type: 'extend', value: [{ label: '查找知識點', content: '@system Knowledge_document_list' }] }
                ]
            };
            addMessage(returnMessage, false);
            hideTypingIndicator();
            return false;
    }

    try {
        // 等待伺服器回應
        const response = await fetch(apiUrl, {
            method: method,
            headers: {
                "Authorization": apiKey
            }
        });

        // 檢查是否回應正常
        if (!response.ok) {
            const errorResponse = await response.json();

            addMessage({ sender: 'Rob', text: `${methodText}錯誤，請重新嘗試，或詢問系統管理員。`, buttons: [] }, false);
            throw new Error(`伺服器回應錯誤: ${response.status} - ${JSON.stringify(errorResponse)}`);
            return false;
        }

        // 取得回應內容
        const jsonData = await response.json();

        // 生成按鈕訊息
        let buttons; // 使用 `let`，以便在不同條件下修改 `buttons`
        switch (systemAction) {
            case "knowledge_list":
                buttons = jsonData.data.map(item => ({
                    type: 'extend',
                    value: [{ label: `${item.name}`, content: `@system Knowledge_document_list ${item.id}` }]
                }));
                break;

            case "knowledge_document_list":
                buttons = jsonData.data.map(item => ({
                    type: 'copy',
                    value: [{ label: `${item.name}`, content: `${item.id}` }]
                }));
                break;

            default:
                const defaultMessage = { sender: 'Rob', text: '請依照系統指令操作:' };
                addMessage(defaultMessage, false);
                return false;
        }

        // 構造最終回傳訊息
        const returnMessage = { sender: 'Rob', text: '請選擇以下需要的文件內容：', buttons: buttons };
        addMessage(returnMessage, false);
        return true;

    } catch (error) {
        console.error(`${methodText}錯誤:`, error);
        addMessage({ sender: 'Rob', text: `${methodText}失敗，請重試！`, buttons: [] }, false);
    } finally {
        hideTypingIndicator();
    }
}

function handleDebugMode(message) {
    //const debugMessage = message.replace("@debug", "").trim(); // 移除前贅詞
    //displayMessage(`(除錯模式): ${debugMessage}`, "debug-mode");

    addMessage({ sender: 'Rob', text: `目前無此操作模式，請重新嘗試。`, buttons: [] }, false);
}

function handleAdminMode(message) {
    //const adminMessage = message.replace("@admin", "").trim(); // 移除前贅詞
    //displayMessage(`(管理模式): ${adminMessage}`, "admin-mode");


    addMessage({ sender: 'Rob', text: `目前無此操作模式，請重新嘗試。`, buttons: [] }, false);
}

//加入Json訊息(Rob <-> 客戶)
function addMessage(messageData, isSent) {
    const { sender, text, buttons } = messageData;

    // 創建訊息外框
    const messageDiv = document.createElement('div');
    const messageClass = isSent ? 'chat-segment-sent' : 'chat-segment-get';

    messageDiv.classList.add('chat-segment', messageClass);

    // 格式化文字內容
    let formattedText = text.replace(/\n/g, '<br>');

    // 生成按鈕 HTML
    const buttonsHTML = buttons?.map(button => {
        if (button.type === 'copy' || button.type === 'extend') {
            // 延伸話題按鈕 + 
            return button.value
                .map(btn => {
                    // 根據 button.type 決定 <i> 的內容
                    const icon = button.type === 'copy' ? '&emsp;<i class="fa-solid fa-pen"></i>' : '';
                    return `<button class="${button.type}-button" onclick="${button.type}MessageBox('${btn.content}')">${btn.label}${icon}</button><br/>`;
                })
                .join('');
        } 
        return '';
    }).join('') || '';

    // 設定訊息 HTML
    messageDiv.innerHTML = `
                        <div class="chat-message">
                            <p>${formattedText}</p>
                            <div class="copy-buttons">
                                ${buttonsHTML}
                            </div>
                        </div>
                        <div class="fw-300 text-muted mt-1 fs-xs">
                            ${getCurrentTime()}
                        </div>`;

    // 插入訊息到頁面
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

//一般訊息
function addNormalMesage(messageData, isSent) {
    const { sender, text, buttons } = messageData;
    // 創建訊息外框
    const messageDiv = document.createElement('div');
    const messageClass = isSent ? 'chat-segment-sent' : 'chat-segment-get';
    // 格式化文字內容
    let formattedText = text
        .replace(/\n/g, '<br>') // 換行轉 <br>
        .replace(/<img(.*?)>/g, '<img class="img-thumbnail"$1>'); // 處理 img 標籤，加入 class
    // 設定訊息 HTML
    messageDiv.innerHTML = `
                        <div class="chat-message">
                            <p>${formattedText}</p>
                        </div>
                        <div class="fw-300 text-muted mt-1 fs-xs">
                            ${getCurrentTime()}
                        </div>`;

    // 插入訊息到頁面
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 複製對話按鈕的處理函式
function copyMessageBox(value) {
    $('#message').val(value);
}

// 延伸對話按鈕的處理函式
function extendMessageBox(value) {
    $('#message').val(value);
    sendButton.click();
}

function insertDateStamp() {
    const date = new Date();
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    const dateStamp = document.createElement('div');
    dateStamp.classList.add('chat-segment', 'chat-segment-date');
    dateStamp.innerHTML = `<span class="time-stamp">${dateStr}</span>`;
    chatMessages.appendChild(dateStamp);
}

function checkDateStamp() {
    const lastDateStamp = chatMessages.querySelector('.time-stamp:last-child');
    const currentDate = new Date();
    const currentDateStr = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;

    if (!lastDateStamp || lastDateStamp.textContent !== currentDateStr) {
        insertDateStamp();
    }
}

function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'pm' : 'am';
    return `${hours % 12 || 12}:${minutes} ${period}`;
}

function showTypingIndicator() {
    typingIndicator.style.opacity = '1';
}

function hideTypingIndicator() {
    typingIndicator.style.opacity = '0';
}