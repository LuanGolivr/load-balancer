import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    stages: [
        { duration: "5m", target: 100 },
        { duration: "5m", target: 300 },
        { duration: "10m", target: 500 },
        { duration: "10m", target: 750 }
    ]
}

export default function (){
    const url =  "http://loadbalancer:8080/api/v1";

    const response = http.get(url);
    check(response, {
        'is status 200': (res) => res.status === 200,
    });
    sleep(1);
}