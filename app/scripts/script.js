$( document ).ready(async () => {
    var check = 1;
    var status = 0;
    var countRoll = -999;
    var waitBet = false;
    var startFirst = false;
    var finishRound = true;
    var placeBet = false;
    // checkToStart();
    const { Selenium, timeOut } = window;
    const client = new Selenium();
    clickButtonCheckLogin();
    await client.loadData();
    
    $('#autoLogin').prop('checked', client.autoLogin);
    $("#username").val(client.account.username);
    $("#password").val(client.account.password);
    $("#autoLogin").change(async function(){
        await client.setAutoLogin($(this).is(':checked'));
    });

    $("#waitroll").change(async function(){
        waitBet = Number($("#waitroll").val()) <= 0 ? false : true;
    });

    $("#bet-edit").click(async function() {
        let show = $(this).attr('data-show');
        if(show == 1){
            $(this).attr('data-show', 0);
            $("#list-bet").hide();
            $("#list-round").text("");
        }else{
            $(this).attr('data-show', 1);
            $("#list-bet").show();
            showRounds();
        }
    });

    $("#save-round").click(async function() {
        let saveRound = [];
        let listRound = $("#list-round").val();
        listRound = listRound.split(",");
        listRound.map((round, key) => {
            let roundSplit = round.split(":");
            if(typeof roundSplit[1] != "undefined"){
                if(roundSplit[1] != ""){
                    saveRound.push(parseFloat(roundSplit[1].replace(/ /gi,"")).toFixed(2));
                }
            }
        });
        await client.setRound(saveRound);
        await showRounds();
    });

    $("#stop").click(async function() {
        if(status == 0) return null;
        $("#start").addClass("btn-info");
        $("#stop").removeClass("btn-danger");
        $("#logs").prepend(`
            <tr>
                <td colspan="5" class="text-center" style="color:red">STOP</td> 
            </tr>`
        );
        status = 0;
    });

    $("#reset").click(async function() {
        client.setNumRound(0);
        $("#logs").prepend(`
            <tr>
                <td colspan="5" class="text-center" style="color:green">RESET</td> 
            </tr>`
        );
    });

    $("#start").click(async function() {
        if(check == 0) {
            $("#status").text("WAIT LOAD");
            return null;
        }else if(check == 2) {
            $("#status").text("LIMITED");
            return null;
        }
        if(status == 0) {
            status = 1;
            $("#start").removeClass("btn-info");
            $("#stop").addClass("btn-danger");
            $("#logs").prepend(`
                <tr>
                    <td colspan="5" class="text-center" style="color:green">START</td> 
                </tr>`
            );
        }
        if(startFirst == false){
            startFirst = true;
            await client.openChrome();
            let username = $("#username").val();
            let password = $("#password").val();
            await client.setAccount({ username, password });
            await startLogin();
        }
    });

    async function startLogin(){
        let checkLogin = await client.checkLogin();
        if(!checkLogin){
            if(client.autoLogin){
                await client.login();
            }else{
                $("#status").text("PLEASE LOGIN FIRST");
            }
            await timeOut(3000);
            await startLogin();
        }else{
            await startRound();
        }
    }

    function startRound(){
        return new Promise(async (resolve, reject) => {
            if(parseFloat(client.numRound) >= client.round.length){
                console.log("STOP ROUND");
                status = 0;
                client.setNumRound(0);
                $("#start").addClass("btn-info");
                $("#stop").removeClass("btn-danger");
                $("#logs").prepend(`
                    <tr>
                        <td colspan="5" class="text-center" style="color:red">STOP</td> 
                    </tr>`
                );
                resolve(await startRound());
            }
            if(status == 0) {
                console.log("PAUSE");
                await timeOut(3000);
                resolve(await startRound());
            }else{
                console.log("NEXT ROUND");
                await client.getBalance();
                if(parseFloat(client.balance) >= parseFloat(client.round[client.numRound])){
                    console.log("RESULT ROUND");
                    $("#bet-current-detail").text("Round "+ (parseInt(client.numRound) + 1) + ": " + parseFloat(client.round[client.numRound]).toFixed(2));
                    resolve(await resultRound());
                }else{
                    console.log("RETURN START ROUND");
                    $("#bet-current-detail").text("Round "+ (parseInt(client.numRound) + 1) + ": " + parseFloat(client.round[client.numRound]).toFixed(2) + " Not Enough Bet");
                    resolve(await startRound());
                }
            }
        });
    }

    function resultRound(){
        return new Promise(async (resolve, reject) => {
            if(placeBet == true && finishRound == false){
                let result = await client.resultImg();
                if(result.indexOf("/img/coin-bonus.806c9d88.png") > -1){
                    console.log("WIN");
                    await timeOut(1000);
                    await client.getBalance();
                    $("#logs").prepend(`
                        <tr>
                            <td>Round: ${parseInt(client.numRound) + 1}</td> 
                            <td>Bet: ${client.round[parseInt(client.numRound)]}</td>
                            <td>Balance: ${client.balance}</td>
                            <td><img src="${result}" style="width: 26px;"></td>
                            <td style="color: green">WIN</td>
                        </tr>`
                    );
                    $("#logs").scrollTop($('#logs')[0].scrollHeight);
                    client.setNumRound(0);
                    finishRound = true;
                    placeBet = false;
                    countRoll = 0;
                    await timeOut(1000);
                    resolve(await startRound());
                }else if(result.indexOf("/img/coin-ct.d399ffd4.png") > -1 || result.indexOf("/img/coin-t.37ae39bf.png") > -1){
                    console.log("LOSE");
                    await client.getBalance();
                    $("#logs").prepend(`
                        <tr>
                            <td>Round: ${parseInt(client.numRound) + 1}</td> 
                            <td>Bet: ${client.round[parseInt(client.numRound)]}</td>
                            <td>Balance: ${client.balance}</td>
                            <td><img src="${result}" style="width: 26px;"></td>
                           <td style="color: red">LOSE</td>
                        </tr>`
                    );
                    $("#logs").scrollTop($('#logs')[0].scrollHeight);
                    client.setNumRound(parseFloat(client.numRound) + 1);
                    finishRound = true;
                    placeBet = false;
                    await timeOut(1000);
                    resolve(await startRound());
                }else{
                    await timeOut(300);
                    resolve(await resultRound());
                }
            }else if(placeBet == false && finishRound == true){
                console.log("INPUT PRICE");
                finishRound = false;
                placeBet = true;
                let price = await client.inputPrice(client.round[client.numRound]);
                waitBet = Number($("#waitroll").val()) <= 0 ? false : true;
                if(client.round[client.numRound] == price && status == 1){
                    if(!waitBet || (countRoll >= Number($("#waitroll").val()) - 1)){
                        await client.placeBet();
                        await timeOut(300);
                        await client.clearInputPrice();
                    }else{
                        countRoll++;
                    }
                }
                resolve(await resultRound());
            }else{
                await timeOut(300);
                resolve(await resultRound());
            }
        });
    }

    function showRounds() {
        return new Promise(async (resolve, reject) => {
            let listRound = "";
            client.round.map((round, key) => {
                let detailRound = "Round" + (key + 1) + ": " + round + ",\n"; 
                listRound += detailRound;
            });
            $("#list-round").val("");
            $("#list-round").val(listRound);
            resolve();
        });
    }

    function checkToStart(){
        $.ajax({
            url: "https://affcoder.com/check/csgo",
            type: "get",
            dataType: "text", 
            success: function (data) {
                check = data;
            },
            error: function (e) {
            },
        });
    }

    async function clickButtonCheckLogin(){
        await timeOut(5000);
        await client.clickButtonCheckLogin();
        clickButtonCheckLogin();
    }
}) ;