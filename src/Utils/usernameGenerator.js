import { ADJECTIVES, ANIMALS } from "../constant.js";
import { redis } from "../DB/connect.redis.js";


const generateUniqueUserName = async () =>{
    const ADJECTIVE_INDEX = Math.floor(Math.random() * ADJECTIVES.length);
    const ANIMAL_INDEX = Math.floor(Math.random() * ANIMALS.length);

    const UNIQUE_USER_NAME = `${ADJECTIVES[ADJECTIVE_INDEX]}_${ANIMALS[ANIMAL_INDEX]}`;
    const exits = await redis.sadd("usernames",UNIQUE_USER_NAME);
    if(exits === 0){
        return generateUniqueUserName();
    }
    return UNIQUE_USER_NAME;
}


export default {generateUniqueUserName}