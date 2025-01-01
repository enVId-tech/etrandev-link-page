"use server";
import React from "react";
import styles from "@/styles/page.module.scss";
import dotenv from "dotenv";
import path from "path";
import {Work_Sans} from 'next/font/google';
import {NextFont} from "next/dist/compiled/@next/font";

dotenv.config({path: path.resolve(__dirname, ".env")});

interface DomainObject {
    domain_names: string;
    isEnabled: boolean;
}

interface TokenResponse {
    token: string;
}

const Work_Sans_300: NextFont = Work_Sans({
    weight: "300",
    style: 'normal',
    subsets: ['latin'],
})
const Work_Sans_500: NextFont = Work_Sans({
    weight: "500",
    style: 'normal',
    subsets: ['latin'],
})

let ignoreUrls: string[] | undefined = dotenv.config().parsed?.IGNORE_URLS.split(',');

// async function checkUrl(url: string): Promise<boolean> {
//     try {
//         const response = await fetch('https://' + url, {
//             method: 'HEAD'
//         });
//
//         return response.ok;
//     } catch (error) {
//         console.error(error);
//         return false;
//     }
// }

async function getToken(): Promise<string> {
    if (!dotenv.config().parsed?.IDENTITY || !dotenv.config().parsed?.SECRET) {
        console.log('Error: ', 'Identity or Secret not found');
        return "";
    }

    const data = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "identity": dotenv.config().parsed?.IDENTITY,
            "secret": dotenv.config().parsed?.SECRET
        })
    }

    const response: Response = await fetch('http://192.168.1.89:81/api/tokens', data);

    if (!response.ok) {
        console.log('Error: ', response.statusText);
        return "";
    }

    const json: TokenResponse = await response.json();

    if (!json.token) {
        console.log('Error: ', 'Token not found');
        return "";
    }

    return json.token;
}

async function getProxyHosts(): Promise<DomainObject[]> {
    const token: string = await getToken();

    const response2 = await fetch('http://192.168.1.89:81/api/nginx/proxy-hosts', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    const json2: DomainObject[] = await response2.json();

    const responseArr: DomainObject[] = [];

    if (ignoreUrls === undefined) {
        ignoreUrls = [];
    }

    for (const key in json2) {
        if (!json2[key].domain_names || ignoreUrls.includes(json2[key].domain_names[0])) {
            continue;
        }

        const obj = {
            domain_names: json2[key].domain_names[0],
            isEnabled: true
        }

        responseArr.push(obj);
    }

    // for (const key in responseArr) {
    //     responseArr[key].isEnabled = await checkUrl(responseArr[key].domain_names);
    // }

    return responseArr;
}

async function getRedirectHosts(): Promise<DomainObject[]> {
    const token: string = await getToken();

    const response2 = await fetch('http://192.168.1.89:81/api/nginx/redirection-hosts', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    const json2: DomainObject[] = await response2.json();

    const responseArr: DomainObject[] = [];

    if (ignoreUrls === undefined) {
        ignoreUrls = [];
    }

    for (const key in json2) {
        if (!json2[key].domain_names || ignoreUrls.includes(json2[key].domain_names[0])) {
            continue;
        }

        const obj = {
            domain_names: json2[key].domain_names[0],
            isEnabled: true
        }

        responseArr.push(obj);
    }

    // for (const key in responseArr) {
    //     responseArr[key].isEnabled = await checkUrl(responseArr[key].domain_names);
    // }

    return responseArr;
}

export default async function Home(): Promise<React.ReactElement> {
    const proxyData: DomainObject[] = await getProxyHosts();
    const redirectData: DomainObject[] = await getRedirectHosts();

    return (
        <div className={`${styles.page} ${Work_Sans_500.className}`}>
            <div className={styles.main}>
                <div className={`${styles.proxyData}`}>
                    <div className={styles.title}>Locally Hosted Website</div>
                    <div className={styles.proxyDataDiv}>
                        {
                            proxyData.map((item: DomainObject, index: number) => {
                                return (
                                    <a key={`${index}proxyData`}
                                       className={`${styles.link} ${item.isEnabled ? styles.enabled : styles.disabled} ${Work_Sans_300.className}`}
                                       href={`${'https://' + item.domain_names}`}>{item.domain_names}</a>
                                )
                            })
                        }
                    </div>
                </div>
                <div className={styles.redirectData}>
                    <div className={styles.title}>Website Redirects</div>
                    <div className={styles.redirectDataDiv}>
                        {

                            redirectData.map((item: DomainObject, index: number) => {
                                return (
                                    <a key={`${index}redirectData`}
                                       className={`${styles.link} ${item.isEnabled ? styles.enabled : styles.disabled} ${Work_Sans_300.className}`}
                                       href={`${'https://' + item.domain_names}`}>{item.domain_names}</a>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
