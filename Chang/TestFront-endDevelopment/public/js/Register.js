//註冊表單檢查
function signUpcheck() {
    // 取得表單中使用者填入的資料
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const email = document.getElementById('email').value.trim();

    // 檢查使用者填入的資料是否為空
    if (!username) {
        alert('帳號請填寫完整資訊');
        return false;
    }
    if (!password) {
        alert('密碼請填寫完整資訊');
        return false;
    }
    if (!email) {
        alert('電子信箱請填寫完整資訊');
        return false;
    }

//     // 檢查帳號長度是否符合要求
//     if (username.length < 6 || username.length > 20) {
//         alert('帳號長度應為 6~20 個字元');
//         return false;
//     }

//     // 檢查密碼長度是否符合要求
//     if (password.length < 6 || password.length > 20) {
//         alert('密碼長度應為 6~20 個字元');
//         return false;
//     }

    // 檢查電子信箱格式是否正確
    const emailRegexp = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegexp.test(email)) {
        alert('電子信箱格式不正確');
        return false;
    }

    // 表單驗證通過
    return true;
}