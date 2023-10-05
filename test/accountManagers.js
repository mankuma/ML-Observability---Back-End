var chai = require('chai');
const addContext = require('mochawesome/addContext');
var chaiHttp = require('chai-http');
const accountManagersSchema = require('./schemas/accountManagers.schema');
require('dotenv').config();

should = chai.should();
expect = chai.expect;
baseURL = process.env.BASE_URL;
token = process.env.BEARER_TOKEN;

chai.use(chaiHttp);
chai.use(require('chai-json-schema'));

describe('entity/accountManagers', function () { 
  it("My Accounts with no bearer token", function (done) {
    var _this = this;
    chai
      .request(baseURL)
      .get('/entity/accountManagers')
      .end(function (err, res) {
        try{
          if(err){
            console.log(err)
          }
        expect(res).to.have.status(401);  
        done();
        }
        catch(err){
          console.log(err)
          addContext(_this, {
            title: 'error message',
            value: err
          });
        }
      });
  });

  it("My Accounts with invalid bearer token without params", function (done) {
    var _this = this;
    chai
      .request(baseURL)
      .get('/entity/accountManagers')
      .query({ marketingentityseq: '12619039' })
      .set('Authorization', 'Bearer 123456789')
      .end(function (err, res) {
        try{
          if(err){
            console.log(err)
          }
      expect(res).to.have.status(401);  
      done();
        }
        catch(err){
          console.log(err)
          addContext(_this, {
            title: 'error message',
            value: err
          });
        }
      });
  });

  it("My Accounts with valid customer code", function (done) {
    var _this = this;
    chai
      .request(baseURL)
      .get('/entity/accountManagers')
      .query({ marketingentityseq: '9437517' })
      .set('Authorization', token)
      .end(function (err, res) {
        try{
          if(err){
            console.log(err)
          }

          const responseCount = res.body.metadata.rows;
          
          for(i=0;i<responseCount;i++){
            expect(res.body.response[i]).to.be.jsonSchema(accountManagersSchema);
            };
        done();
        }
        catch(err){
          console.log(err)
          addContext(_this, {
            title: 'error message',
            value: err
          });
        }
      });
  });

  it("My Accounts with invalid customer Code", function (done) {
    var _this = this;
    chai
      .request(baseURL)
      .get('/entity/accountManagers')
      .query({ marketingentityseq: '9437411' })
      .set('Authorization', token)
      .end(function (err, res) {
        try{
          if(err){
            console.log(err)
          }
        expect(res).to.have.status(200);
        expect((res) => {     
          assert.equal(res.body[0]);
        });
        done();
        }
        catch(err){
          console.log(err)
          addContext(_this, {
            title: 'error message',
            value: err
          });
      }
      });
  });

  it("My Accounts with no customer Code", function (done) {
    var _this = this;
    chai
      .request(baseURL)
      .get('/entity/accountManagers')
      .set('Authorization', token)
      .end(function (err, res) {
        try{
          if(err){
            console.log(err)
          }
        expect(res).to.have.status(400);
        done();
        }
        catch(err){
          console.log(err)
          addContext(_this, {
            title: 'error message',
            value: err
          });
        }
      });
  });

  it("My Accounts with invalid query parameter name marketingentityseq", function (done) {
    var _this = this;
    chai
      .request(baseURL)
      .get('/entity/accountManagers')
      .query({ marketingentityid: '9437517' })
      .set('Authorization', token)
      .end(function (err, res) {
        try{
          if(err){
            console.log(err)
          }
        expect(res).to.have.status(400);
        done();
        }
        catch(err){
          console.log(err)
          addContext(_this, {
            title: 'error message',
            value: err
          });
        }
      });
  });

});
