import React, { createContext, SetStateAction, useContext, useState } from 'react';
import nacl from 'tweetnacl';



const keypair = nacl.box.keyPair()
interface ICommonContext {
	dappKey: typeof keypair
	setDAppKey: React.Dispatch<SetStateAction<typeof keypair>>;
}

const CommonContext = createContext({} as ICommonContext);

export const useCommonContext = () => useContext(CommonContext);

export const CommonProvider = ({ children }: { children: JSX.Element }) => {
	const [dappKey, setDAppKey] = useState(nacl.box.keyPair());

	return (
		<CommonContext.Provider value={{ setDAppKey, dappKey }}>{children}</CommonContext.Provider>
	);
};
