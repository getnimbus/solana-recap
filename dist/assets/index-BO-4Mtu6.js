import{cJ as k,cK as b,aq as B,u as g,at as w,bE as $,bF as I,bG as m,l as o,cL as f,v as c,s as h,cM as S,bN as _,m as x,bI as E,q as T,bJ as l,cN as U,bS as C,cO as F}from"./Bridge.js";import{A as O}from"./aptos-Bbj6gw3L.js";import"./index.js";var N=Object.defineProperty,R=(i,e,t)=>e in i?N(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t,a=(i,e,t)=>R(i,typeof e!="symbol"?e+"":e,t);class W{constructor(e,t,s,n,r=!1){a(this,"transaction"),a(this,"network"),a(this,"chain"),a(this,"description"),a(this,"parallelizable"),this.transaction=e,this.network=t,this.chain=s,this.description=n,this.parallelizable=r}}const P=[{name:"tokenBridgeAddress",...k},{name:"chain",...b()},{name:"domainSeparator",binary:"bytes",custom:B.encode(g),omit:!0},{name:"tokenId",...k},{name:"domainSeparator",binary:"bytes",custom:new Uint8Array([255]),omit:!0}],Q=i=>F(P,i);class d{constructor(e,t,s,n){a(this,"network"),a(this,"chain"),a(this,"connection"),a(this,"contracts"),a(this,"chainId"),a(this,"tokenBridgeAddress"),this.network=e,this.chain=t,this.connection=s,this.contracts=n,this.chainId=w(t);const r=n.tokenBridge;if(!r)throw new Error(`TokenBridge contract Address for chain ${t} not found`);this.tokenBridgeAddress=r}static async fromRpc(e,t){const[s,n]=await O.chainFromRpc(e),r=t[n];if(r.network!==s)throw new Error("Network mismatch "+r.network+" !== "+s);return new d(s,n,e,r.contracts)}async isWrappedAsset(e){try{return await this.getOriginalAsset(e),!0}catch{return!1}}async getOriginalAsset(e){const t=e.toString().split(g);let s;if(s=(await this.connection.getAccountResource(t[0],`${this.tokenBridgeAddress}::state::OriginInfo`)).data,!s)throw $;const n=I(parseInt(s.token_chain.number)),r=new m(s.token_address.external_address);return{chain:n,address:r}}async getTokenUniversalAddress(e){return new m(o.encode(f(e.toString()),!0))}async getTokenNativeAddress(e,t){const s=e===this.chain?await this.getTypeFromExternalAddress(t.toString()):await this.getAssetFullyQualifiedType({chain:e,address:t});if(!s)throw new Error("Invalid asset address.");return new c(s)}async hasWrappedAsset(e){try{return await this.getWrappedAsset(e),!0}catch{}return!1}async getWrappedAsset(e){if(h(e.address))throw new Error("native asset cannot be a wrapped asset");const t=await this.getAssetFullyQualifiedType(e);if(!t)throw new Error("Invalid asset address.");return await this.connection.getAccountResource(S(t),`${this.tokenBridgeAddress}::state::OriginInfo`),_(this.chain,t)}async isTransferCompleted(e){const t=(await this.connection.getAccountResource(this.tokenBridgeAddress,`${this.tokenBridgeAddress}::state::State`)).data.consumed_vaas.elems.handle;try{return await this.connection.getTableItem(t,{key_type:"vector<u8>",value_type:"u8",key:`0x${x.Buffer.from(E(e.hash)).toString("hex")}`}),!0}catch{return!1}}async getWrappedNative(){return _(this.chain,T)}async*createAttestation(e,t){const s={chain:this.chain,address:new c(e)},n=await this.getAssetFullyQualifiedType(s);if(!n)throw new Error("Invalid asset address.");yield this.createUnsignedTx({function:`${this.tokenBridgeAddress}::attest_token::attest_token_entry`,type_arguments:[n],arguments:[]},"Aptos.AttestToken")}async*submitAttestation(e,t){yield this.createUnsignedTx({function:`${this.tokenBridgeAddress}::wrapped::create_wrapped_coin_type`,type_arguments:[],arguments:[l(e)]},"Aptos.CreateWrappedCoinType");const s=await this.getAssetFullyQualifiedType(e.payload.token);if(!s)throw new Error("Invalid asset address.");yield this.createUnsignedTx({function:`${this.tokenBridgeAddress}::wrapped::create_wrapped_coin`,type_arguments:[s],arguments:[l(e)]},"Aptos.CreateWrappedCoin")}async*transfer(e,t,s,n,r){const v=0n,p=0n,u=h(s)?T:s.toString(),y=t.address.toUniversalAddress().toUint8Array(),A=w(t.chain);r?yield this.createUnsignedTx({function:`${this.tokenBridgeAddress}::transfer_tokens::transfer_tokens_with_payload_entry`,type_arguments:[u],arguments:[n,A,y,p,r]},"Aptos.TransferTokensWithPayload"):yield this.createUnsignedTx({function:`${this.tokenBridgeAddress}::transfer_tokens::transfer_tokens_entry`,type_arguments:[u],arguments:[n,A,y,v,p]},"Aptos.TransferTokens")}async*redeem(e,t,s=!0){const n=t.payload.token.chain===this.chain?await this.getTypeFromExternalAddress(t.payload.token.address.toString()):await this.getAssetFullyQualifiedType(t.payload.token);if(!n)throw new Error("Invalid asset address.");yield this.createUnsignedTx({function:`${this.tokenBridgeAddress}::complete_transfer::submit_vaa_and_register_entry`,type_arguments:[n],arguments:[l(t)]},"Aptos.CompleteTransfer")}async getAssetFullyQualifiedType(e){return e.chain===this.chain?U(e.address.toString())?e.address.toString():null:`${d.getForeignAssetAddress(this.chain,this.tokenBridgeAddress,e)}::coin::T`}async getTypeFromExternalAddress(e){try{const t=(await this.connection.getAccountResource(this.tokenBridgeAddress,`${this.tokenBridgeAddress}::state::State`)).data,{handle:s}=t.native_infos,n=await this.connection.getTableItem(s,{key_type:`${this.tokenBridgeAddress}::token_hash::TokenHash`,value_type:"0x1::type_info::TypeInfo",key:{hash:e}});return n?[n.account_address,String.fromCharCode(...o.decode(n.module_name)),String.fromCharCode(...o.decode(n.struct_name))].join(g):null}catch{return null}}static getForeignAssetAddress(e,t,s){if(h(s.address))throw new Error("Invalid token address");const n=Q({chain:s.chain,tokenBridgeAddress:new c(t).toUniversalAddress(),tokenId:s.address.toUniversalAddress()});return o.encode(f(n),!0)}createUnsignedTx(e,t,s=!1){return new W(e,this.network,this.chain,t,s)}}C("Aptos","TokenBridge",d);export{d as AptosTokenBridge};