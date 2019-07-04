import React from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap'; 
import XLSX from 'xlsx'
const fs = require('fs');

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      fileName: "",
      alertType: "info",
      alertInfo: "准备好了,选择文件吧",
      timeBase: 10,
      timeWidth: 0
    };
    this.selectFile = this.selectFile.bind(this);
    this.notPass = [];
  }

  printResult() {
    if(this.notPass.length == 0) {
      this.setState({
        alertType: "success",
        alertInfo: '完全正确'
      });
    } else {
      this.setState({
        alertType: "danger",
        alertInfo: '数据有问题, 结果在result.txt'
      });
    }
    fs.writeFile('result.txt', this.notPass,  function(err) {
      if (err) {
          return console.error(err);
      }
      console.log("数据写入成功！");
      console.log("--------我是分割线-------------")
      console.log("读取写入的数据！");
   });
  }

  checkFile(timeArray) {
    let lastTime = 0;
    const timeBase = this.state.timeBase * 1000;
    const timeWidth = this.state.timeWidth * 1000;
    console.log('timebase: ', this.state.timeBase, 'timeWidth: ', this.state.timeWidth);
    for(const index in timeArray) {
      if (lastTime == 0) {
        lastTime = timeArray[index];
        console.log('first time.')
      } else {
        if (Math.abs(timeArray[index]-lastTime-timeBase) > timeWidth) {
          this.notPass.push(parseInt(index)+1); 
        } else {
          console.log('pass: ', index);
        }
      }
      lastTime = timeArray[index];
    }
    console.log('notpass: ', this.notPass);
    this.printResult();
  }

  selectFile() {
    console.log('select file.');
    const dialog = require('electron').remote.dialog;
    dialog.showOpenDialog({
          title: '选择要上传的文件',
          properties: ['openFile', 'showHiddenFiles']
        }, (filePath) => {
          // filePaths:用户选择的文件路径的数组
            console.log(filePath[0]);
            this.setState({
              fileName: filePath[0],
              alertType: "info",
              alertInfo: '检查中',
              timeBase: 10,
              timeWidth: 0
            });
            const workBook = XLSX.readFile(filePath[0]);
            console.log('workBook: ', workBook);
            const sheetNames = workBook.SheetNames;
            console.log('sheetNames: ', sheetNames);
            const workSheet = workBook.Sheets[sheetNames[0]];
            const rows = workSheet['!rows'];
            const ref = workSheet['!ref'];
            console.log('ref: ', ref);
            const beginEnd = ref.split(':').map( str => { return parseInt(str.match(/[0-9]+$/g))});
            let timeArray = [];
            for(let i = beginEnd[0]+1; i <= beginEnd[1]; i++) {
              const address = 'A' + i.toString();
              if (typeof(workSheet[address]) == "undefined") {
                this.checkFile(timeArray);
                break;
              }
              let dateString = workSheet[address].v;
              let timeStamp = new Date(dateString).getTime();
              timeArray.push(timeStamp);
            }
            console.log('timeArray:', timeArray);
            console.log('ref:', ref);
            console.log('beginEnd:', beginEnd);
            this.checkFile(timeArray);
        })
  }

  render() {
    console.log("debug info");
    return (<div style={{margin:'100px'}}>
      <Container>
        <Row>
        <Alert key="alert-info" variant={this.state.alertType}>
            {this.state.alertInfo}
        </Alert>
        </Row>
        <Row>
          <h4 style={{margin:'20px'}}>请选择文件</h4>
          <Button variant="primary" onClick={this.selectFile}>选择文件</Button>
        </Row>
        <Row>
          {this.state.fileName}
        </Row>
      </Container>

    </div>);
  }
}
