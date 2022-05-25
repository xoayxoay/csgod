const chromedriver = require('chromedriver');
const timeOut = require('./timeOut');
const Chrome = require('selenium-webdriver/chrome');
const _http = require('selenium-webdriver/http');
const {Builder, By, Key, until, WebDriver} = require('selenium-webdriver');

const roundDefault = [0.01,0.01,0.01,0.01,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.03,0.03,0.03,0.03,0.03,0.04,0.04,0.04,0.05,0.05,0.05,0.06,0.06,0.07,0.07,0.08,0.08,0.09,0.1,0.1,0.11,0.12,0.13,0.14,0.15,0.16,0.17,0.19,0.20,0.22,0.23,0.25,0.27,0.29,0.31,0.34,0.36,0.39,0.42,0.45,0.5,0.53,0.57,0.61,0.66,0.71,0.76,0.82,0.89,0.96,1.03,1.11,1.19,1.29,1.4,1.5,1.62,1.73,1.86,2.1,2.25,2.4,2.6,2.8,3,3.2,3.45,3.7,4,4.3,4.65,5,5.35,5.8,6.25,6.75,7.25,7.8,8.4,9.05,9.75,10.55,11.35,12.2,13.15,14.15,15.25,16.4,17.65];
class Selenium {
  constructor() {
    this.browser = 'chrome';
    this.goLink = 'https://csgoempire.com/';
  }

  loadData() {
    return new Promise(async (resolve, reject) => {
      if(typeof localStorage.getItem('numRound') === "undefined"){
        localStorage.setItem('numRound',0);
      }
      if(typeof localStorage.getItem('round') === "undefined"){
        localStorage.setItem('round',JSON.stringify(roundDefault));
      }
      this.numRound = typeof localStorage.getItem('numRound') !== "undefined" ? localStorage.getItem('numRound') : 0;
      this.balance = typeof localStorage.getItem('balance') !== "undefined" ? localStorage.getItem('balance') : 0;
      this.sessionId = typeof localStorage.getItem('sessionId') !== "undefined" ? localStorage.getItem('sessionId') : null;
      this.autoLogin = typeof localStorage.getItem('autoLogin') !== "undefined" ? localStorage.getItem('autoLogin') : true;
      this.round = typeof localStorage.getItem('round') !== "undefined" ? JSON.parse(localStorage.getItem('round')) : roundDefault;
      this.round = Array.isArray(this.round) ? this.round : roundDefault;
      this.account = { 
        username: typeof localStorage.getItem('username') !== "undefined" ? localStorage.getItem('username') : '', 
        password: typeof localStorage.getItem('password') !== "undefined" ? localStorage.getItem('password') : ''
      };
      resolve(true);
    });
  }

  openChrome() {
    return new Promise(async (resolve, reject) => {
      try {
        this.sessionId = typeof localStorage.getItem('sessionId') !== "undefined" ? localStorage.getItem('sessionId') : null;
        //Connect to existing session
        this.driver = await new WebDriver(
            this.sessionId,
            new _http.Executor(Promise.resolve(null))
        );

        await this.driver.get(this.goLink).catch(async r => {
          console.log('Session ' + this.sessionId + ' not found. Creating new session.');
          let driverPath = this.getDriverPath();
          const chromeService = new Chrome.ServiceBuilder(driverPath);
          this.driver = await new Builder()
            .forBrowser(this.browser)
            .setChromeService(chromeService)
            .build();
          this.driver.manage().window().maximize();
          let sessionId = await this.driver.getSession();
          localStorage.setItem('sessionId', sessionId.id_); 
          console.log('Session: ' + sessionId.id_);
          this.driver.get(this.goLink);
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  getBalance() {
    return new Promise(async (resolve, reject) => {
      try {
        let balance = await this.driver.findElement(By.xpath('//div[contains(@class,"balance")]')).getText();
        balance = parseFloat(balance);
        localStorage.setItem('balance',balance);
        this.balance = balance;
        resolve();
      } catch (e) {
        await timeOut(500);
        resolve(await this.getBalance());
      }
    });
  }

  inputPrice(price) {
    return new Promise(async (resolve, reject) => {
      try {
        let input = await this.driver.findElement(By.xpath('//input[contains(@placeholder,"Enter bet amount...")]'));
        await this.inputText('//input[contains(@placeholder,"Enter bet amount...")]',price.toString());
        resolve(input.getAttribute("value"));
      } catch (e) {
        await timeOut(300);
        resolve(await this.inputPrice(price));
      }
    });
  }

  clearInputPrice() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.driver.findElement(By.xpath('//input[contains(@placeholder,"Enter bet amount...")]')).clear();
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });
  }

  placeBet() {
    return new Promise(async (resolve, reject) => {
      try {
        let betButton = await this.driver.findElement(By.xpath("//img[contains(@src,'/img/coin-bonus.806c9d88.png')]//parent::button[@class='bet-btn']"));
        await betButton.click();
        resolve();
      } catch (e) {
        await timeOut(300);
        resolve(await this.placeBet());
      }
    });
  }

  result() {
    return new Promise(async (resolve, reject) => {
      try {
        let betButton = await this.driver.findElement(By.xpath("//img[contains(@src,'/img/coin-bonus.806c9d88.png')]//parent::button[contains(@class,'bet-btn')]"));
        let className = betButton.getAttribute('class');
        resolve(className);
      } catch (e) {
        await timeOut(300);
        resolve(await this.result());
      }
    });
  }

  resultImg() {
    return new Promise(async (resolve, reject) => {
      try {
        let winButton = await this.driver.findElement(By.xpath("//button[contains(@class,'bet-btn--win')]//img"));
        let src = winButton.getAttribute('src');
        resolve(src);
      } catch (e) {
        await timeOut(300);
        resolve(await this.result());
      }
    });
  }

  setAccount(account) {
    return new Promise(async (resolve, reject) => {
      try {
        localStorage.setItem('username',account.username);
        localStorage.setItem('password',account.password);
        this.account = account;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  setAutoLogin(autoLogin) {
    return new Promise(async (resolve, reject) => {
      try {
        localStorage.setItem('autoLogin',autoLogin);
        this.autoLogin = autoLogin;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  setRound(round){
    return new Promise(async (resolve, reject) => {
      try {
        localStorage.setItem('round',JSON.stringify(round));
        this.round = round;
        resolve(round);
      } catch (e) {
        reject(e);
      }
    });
  }

  setNumRound(numRound){
    return new Promise(async (resolve, reject) => {
      try {
        localStorage.setItem('numRound',numRound);
        this.numRound = numRound;
        resolve(numRound);
      } catch (e) {
        reject(e);
      }
    });
  }

  checkLogin() {
    return new Promise(async (resolve, reject) => {
      try {
        let signInButton = this.driver.findElement(By.xpath("//a[contains(@class,'button-primary button-primary--green')][contains(text(), 'Sign In')]"));
        try {
          if(this.autoLogin) await signInButton.click();
          resolve(false);
        } catch (e) {
          resolve(true);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  clickButtonCheckLogin() {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(true);
        let ButtonCheckLogin = this.driver.findElement(By.xpath("//button[contains(@class,'button-primary button-primary--gold w-full')][contains(text(), 'OK')]"));
        try {
          await ButtonCheckLogin.click();
          resolve(false);
        } catch (e) {
          resolve(true);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  login() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.inputText("//input[@id='steamAccountName']",this.account.username);
        await this.inputText("//input[@id='steamPassword']",this.account.password);
        let buttonLogin = this.driver.findElement(By.xpath('//div[@id="login_btn_signin"]//input'));
        await buttonLogin.click();
        try {
          resolve(true);
        }catch (e) {
          resolve(false);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  inputText(path,string) {
    return new Promise(async (resolve, reject) => {
      try {
        let chars = string.split('');
        await this.driver.findElement(By.xpath(path)).clear();
        await timeOut(300);
        for (let i = 0; i < chars.length; i++) {
          await timeOut(this.getRandomInt(2) * 100);
          await this.driver.findElement(By.xpath(path)).sendKeys(chars[i], "");
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

   getText() {
    return new Promise(async (resolve, reject) => {
      try {
        let listSearch = await this.driver.findElement(By.className('sbct'));
        // await this.driver.wait(until.titleIs(string+' - Google Search'), 1000);
        resolve(listSearch.getText());
      } catch (e) {
        reject(e);
      }
    });
  }

  getDriverPath() {
    const driverPath = chromedriver.path;
    const driverPathBuild = driverPath.replace('app.asar', 'app.asar.unpacked');
    return driverPathBuild;
  }

  getRandomInt(max) {
    return 2 + Math.floor(Math.random() * Math.floor(max));
  }
}

module.exports = Selenium;
