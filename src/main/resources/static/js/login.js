const DUPLICATE = -3;
const INVALID_APPROACH = -2;
const FAIL = -1;
const ADMIN = 0;
const SUCCESS = 1;


$.btnClick = function (btn) {
    let func = null;
    switch (btn.className) {
        case 'login' : func = $.login; break;
        case 'logout' : func = $.logout; break;
        case 'join' : func = $.join; break;
        case 'find-pwd' : func = $.findPwd; break;
        default : return;
    }
    func();
};

$.join = async function () {
    let inputId = await $.swalInput('text', '회원가입', '사용할 아이디를 입력하세요', '다음 &rarr;');
    if (inputId === undefined) return;
    $.ajax({
        url: '/member/check-duplicate',
        type: 'GET',
        data: {id : inputId},
        success: async function (data) {
            if (data.result === DUPLICATE) {
                Swal.fire("아이디 중복", "다른 아이디를 입력해주세요", "error").then($.join);
            } else {
                let inputPwd = await $.joinPwd();
                let inputEmail = await $.joinEmail();
                let inputNick = await $.swalInput('text', '회원가입', '닉네임을 입력하세요', '회원가입');
                console.log({inputId:inputId, inputPwd:inputPwd, inputEmail:inputEmail, inputNick: inputNick});
                $.ajax({
                    url: '/member/join',
                    type: 'POST',
                    data: {id: inputId, pwd: inputPwd, email: inputEmail, nick: inputNick},
                    success: function (data) {
                        if (data.result === SUCCESS) {
                            Swal.fire('회원가입 완료', '로그인 창으로 이동합니다', 'success').then($.login);
                        } else {
                            Swal.fire('가입 실패', '회원가입에 실패하였습니다', 'error');
                        }
                    }
                })
            }
        }
    });
}

/* 닉네임 중복체크 필요하면 쓸 함수
 * 현재는 닉네임 중복 가능한 정책
$.joinNick = async function () {
    let inputNick = await $.swalInput('text', '회원가입', '닉네임을 입력하세요', '회원가입');
    if (inputNick === undefined) return;
    $.ajax({
        url: '/member/check-duplicate-nick',
        type: 'GET',
        data: {nick: inputNick},
        success: function(data) {
            if (data.result === DUPLICATE) {
                Swal.fire("닉네임 중복", "다른 닉네임을 입력해주세요", "error").then($.joinNick);
            } else {
                return inputNick;
            }
        }
    });
}
*/

$.joinEmail = async function () {
    let inputEmail = await $.swalInput('email', '회원가입', '이메일 주소를 입력하세요', '다음 &rarr;');
    if (inputEmail === undefined) return;
    if (!isRight()) {   // 이메일 유효성 정규 표현식
        await Swal.fire('유효성 실패', '유효하지 않은 이메일 주소입니다.', 'error');
        return await $.joinEmail();
    }
    return inputEmail;
}

function isRight() {
    return true;
}

$.joinPwd = async function () {
    let inputPwd = await $.swalTwoInputs('password', '회원가입', '비밀번호를 입력하세요', '비밀번호', '비밀번호 확인', '다음 &rarr;', '$.enter(this)');
    if (inputPwd === undefined) return;
    if (inputPwd[0] !== inputPwd[1]) {
        await Swal.fire("비밀번호 불일치", "입력하신 두 비밀번호가 일치하지 않습니다.", "error");
        return await $.joinPwd();
    }
    if (inputPwd[0].trim() === "") {
        await Swal.fire("비밀번호 오류", "비밀번호는 공백이 될 수 없습니다.", "error");
        return await $.joinPwd();
    }
    return inputPwd[0];
}

$.findPwd = function () {
    Swal.fire('find');
};

$.enter = function (input) {
    if (window.event.keyCode == 13) {
        switch (input.id) {
            case "swal-input1":
                $('#swal-input2').focus();
                break;
            case "swal-input2":
                $('.swal2-confirm').trigger('click');
                break;
        }
    }
}

$.logout = function () {
    $.ajax({
        url: "/member/logout",
        type: "GET",
        success: function(data) {
            switch (data.result) {
                case SUCCESS:
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: '로그아웃',
                        text: data.nick + '님 안녕히 가세요',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(function (){
                        location.replace("/");
                    });
                    break;
                case INVALID_APPROACH:
                    Swal.fire('잘못된 접근입니다.');
                    break;
            }
        }
    });
}

$.login = async function () {
    let join = '<span class="join" onclick="$.btnClick(this)">회원가입</span>';
    let findPwd = '<span class="find-pwd" onclick="$.btnClick(this)">비밀번호 찾기</span>'

    let id = await $.swalInput('text', '로그인', '아이디를 입력하세요', '다음 &rarr;', join);
    if (id === undefined) return;
    let pwd = await $.swalInput('password', '로그인', '비밀번호를 입력하세요', '로그인', findPwd);
    if (pwd === undefined) return;

    $.ajax({
        url: "/member/login",
        type: "POST",
        data: {id: id, pwd: pwd},
        success: function (data){
            switch (data.result) {
                case FAIL:
                    Swal.fire("로그인 실패", "아이디와 비밀번호를 다시 확인해주세요.", "error").then($.login);
                    break;
                case ADMIN:
                    Swal.fire('로그인 성공', '관리자님 안녕하세요.', 'success')
                        .then(function(){
                            // 관리자 로그인시
                        });
                    break;
                case SUCCESS:
                    Swal.fire('로그인 성공', data.nick + '님 안녕하세요.', 'success')
                        .then(function(){
                            $('button#login').attr('class', 'logout');
                            $('button#login').text("로그아웃");
                        });
                    break;
                default :
                    break;
            }
        }
    });
}

$.swalInput = async function (input, title, text, confirmButtonText, footer) {
    const {value : val} = await Swal.fire({
        input: input,
        title: title,
        text: text,
        confirmButtonText: confirmButtonText,
        confirmButtonColor: '#ff7799',
        showCancelButton: true,
        cancelButtonText: '닫기',
        footer: footer,
        inputValidator: (value) => {
            return new Promise((resolve) => {
                if (value.trim() === '') {
                    resolve('빈칸을 입력할 수 없습니다.');
                } else {
                    resolve();
                }
            });
        }
    });
    return val;
}

$.swalTwoInputs = async function (input, title, text, placeholder1, placeholder2, confirmButtonText, enter) {
    const {value : val} = await Swal.fire({
        title: title,
        html:
            `<div class="swal2-html-container" style="display:block;">${text}</div>` +
            `<input id="swal-input1" onkeypress="${enter}" type="${input}" class="swal2-input" placeholder="${placeholder1}">` +
            `<input id="swal-input2" onkeypress="${enter}" type="${input}" class="swal2-input" placeholder="${placeholder2}">`,
        focusConfirm: false,
        confirmButtonText: confirmButtonText,
        confirmButtonColor: '#ff7799',
        showCancelButton: true,
        cancelButtonText: '닫기',
        preConfirm: () => {
            return [
                $('#swal-input1').val(),
                $('#swal-input2').val()
            ]
        }
    });
    return val;
}