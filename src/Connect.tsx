import base58 from 'bs58';
import { useEffect, useState } from 'react';
import { Button, Linking, Text, View } from 'react-native';
import { URL } from 'react-native-url-polyfill';
import nacl from 'tweetnacl';

import { clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

//@ts-ignore
import { useCommonContext } from './Context';
import { buildUrl, decryptPayload, encryptPayload } from './utils';

const NETWORK = clusterApiUrl("devnet");
const connection = new Connection(NETWORK);

export default function Connect() {
	const { setDAppKey, dappKey } = useCommonContext();
	const [deepLink, setDeepLink] = useState("");
	const [sharedSecret, setSharedSecret] = useState<Uint8Array>();
	const [session, setSession] = useState("");
	const [phantomWalletPublicKey, setPhantomWalletPublicKey] = useState<PublicKey>();

	useEffect(() => {
		(async () => {
			const initialUrl = await Linking.getInitialURL();
			console.log(initialUrl);
			if (initialUrl) {
				setDeepLink(initialUrl);
			}
		})();
		Linking.addEventListener("url", (e) => setDeepLink(e.url));
		return () => {
			Linking.removeAllListeners("url");
		};
	}, []);

	useEffect(() => {
		if (!deepLink) return;

		const url = new URL(deepLink);
		const params = url.searchParams;
		const phantomPublicKey = params.get("phantom_encryption_public_key")!;
		const nonce = params.get("nonce")!;
		const data = params.get("data")!;

		console.log(url.pathname);
		if (/connect/.test(url.pathname)) {
			const sharedSecretDapp = nacl.box.before(
				base58.decode(phantomPublicKey),
				dappKey.secretKey
			);

			const connectData = decryptPayload(data, nonce, sharedSecretDapp);

			setSharedSecret(sharedSecretDapp);
			setSession(connectData.session);
			setPhantomWalletPublicKey(new PublicKey(connectData.public_key));
		}
		if (/sign/.test(url.pathname)) {
			const signAndSendTransactionData = decryptPayload(data, nonce, sharedSecret);
			console.log({ signAndSendTransactionData });
		}
	}, [deepLink]);

	const connect = async () => {
		const dappKeyPair = nacl.box.keyPair();
		setDAppKey(dappKeyPair);
		const params = new URLSearchParams({
			dapp_encryption_public_key: base58.encode(dappKeyPair.publicKey),
			cluster: "devnet",
			app_url: "https://phantom.app",
			redirect_link: "myapp://connect/connect",
		});

		const url = buildUrl("connect", params);
		console.log(url);

		Linking.openURL(url);
	};

	const createTransferTransaction = async () => {
		if (!phantomWalletPublicKey) throw new Error("missing public key from user");
		let transaction = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: phantomWalletPublicKey,
				toPubkey: phantomWalletPublicKey,
				lamports: 100,
			})
		);
		transaction.feePayer = phantomWalletPublicKey;
		const anyTransaction: any = transaction;
		anyTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
		return transaction;
	};

    const disconnect = async () => {
        const payload = {
          session,
        };
        const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);
    
        const params = new URLSearchParams({
          dapp_encryption_public_key: base58.encode(dappKey.publicKey),
          nonce: base58.encode(nonce),
          redirect_link: "myapp://connect/remove",
          payload: base58.encode(encryptedPayload),
        });
    
        const url = buildUrl("disconnect", params);
        Linking.openURL(url);
      };

	const signAndSendTransaction = async () => {
		const transaction = await createTransferTransaction();

		const serializedTransaction = transaction.serialize({
			requireAllSignatures: false,
		});

		const payload = {
			session,
			transaction: base58.encode(serializedTransaction),
		};
		const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);

		const params = new URLSearchParams({
			dapp_encryption_public_key: base58.encode(dappKey.publicKey),
			nonce: base58.encode(nonce),
			redirect_link: "myapp://connect/sign",
			payload: base58.encode(encryptedPayload),
		});

		const url = buildUrl("signAndSendTransaction", params);
		Linking.openURL(url);
	};

	return (
		<View>
			<Text>{deepLink}</Text>
			<Button onPress={connect} title="Connect" />
			{deepLink && <Button onPress={signAndSendTransaction} title="Sign" />}
			{deepLink && <Button onPress={disconnect} title="Disconnect" />}
		</View>
	);
}
