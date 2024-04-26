
import generateRandomString from "@/helpers/generateRandomString";

describe('generateRandomString', () => {


      test ('show strings', ()=> {
        for (let i=1; i<10; i++) {
        console.log(generateRandomString(3));
      }
      }); 
});
    