import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../../contracts/abi.json';
import './contract.css';
import { Button, Spacer, Spinner, Note, Tag, Description, Input, Link } from '@geist-ui/core';

export const Contract = ({ wallet, ceramic, writer, handleMessage }) => {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenPrice, setTokenPrice] = useState('');
  const [initialMint, setInitialMinit] = useState('');
  const [deploymentFee, setDeploymentFee] = useState('');
  const [userHasDeployed, setUserHasDeployed] = useState(false);
  const [writerERC20, setWriterERC20] = useState();
  const [userDeployedContractAddress, setUserDeployedContractAddress] = useState('');
  const [userTokenName, setUserTokenName] = useState('');
  const [userTokenSymbol, setUserTokenSymbol] = useState('');
  const [userTokenPrice, setUserTokenPrice] = useState('');
  const [userTokenTotalMinted, setUserTokenTotalMinted] = useState('');
  const [userTokenContractBalance, setUserTokenContractBalance] = useState('');
  const [userTokenBalance, setUserTokenBalance] = useState('');
  const [newMint, setNewMint] = useState();
  const [transferAddress, setTransferAddress] = useState();
  const [newTokenPrice, setNewTokenPrice] = useState();
  const [deployBtnLoading, setDeployBtnLoading] = useState(false);
  const [mintBtnLoading, setMintBtnLoading] = useState(false);
  const [transferBtnLoading, setTransferBtnLoading] = useState(false);
  const [changePriceBtnLoading, setChangePriceBtnLoading] = useState(false);
  const [withdrawBtnLoading, setWithdrawBtnLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (writer !== undefined) {
        const deploymentFee = await writer.getDeploymentFee();
        setDeploymentFee(deploymentFee);

        const userHasDeployed = await writer.getHasWriterDeployed(wallet.address);
        if (userHasDeployed) {
          setUserHasDeployed(true);

          const deployedContractAddress = await writer.getWriterDeployedContractAddress(wallet.address);
          setUserDeployedContractAddress(deployedContractAddress);

          const writerERC20 = new ethers.Contract(deployedContractAddress, contractABI.writerERC20, wallet.signer);
          setWriterERC20(writerERC20);

          const userTokenName = await writerERC20.name();
          setUserTokenName(userTokenName);
          const userTokenSymbol = await writerERC20.symbol();
          setUserTokenSymbol(userTokenSymbol);
          const userTokenPrice = ethers.utils.formatEther(await writerERC20.getTokenPrice()) + ' MATIC';
          setUserTokenPrice(userTokenPrice);
          const userTokenTotalMinted = Number(await writerERC20.totalSupply());
          setUserTokenTotalMinted(userTokenTotalMinted);
          const userTokenContractBalance = ethers.utils.formatEther(await writerERC20.getContractBalance()) + ' MATIC';
          setUserTokenContractBalance(userTokenContractBalance);
          const userTokenBalance = Number(await writerERC20.balanceOf(wallet.address));
          setUserTokenBalance(userTokenBalance);
        }
      }
    }
    init();
  }, [writer]);

  const deployWriterERC20Contract = async () => {
    try {
      if (!tokenName) {
        handleMessage('warning', 'Please enter token name.');
      } else if (!tokenSymbol) {
        handleMessage('warning', 'Please enter token symbol.');
      } else if (!tokenPrice) {
        handleMessage('warning', 'Please enter token price.');
      } else if (!initialMint) {
        handleMessage('warning', 'Please enter initial mint.');
      } else {
        setDeployBtnLoading(true);

        const txn = await writer.deployWriterERC20Contract(
          ceramic.did,
          tokenName,
          tokenSymbol,
          ethers.utils.parseEther(tokenPrice),
          Number(initialMint),
          { value: deploymentFee }
        );

        const receipt = await txn.wait();

        if (receipt.status === 1) {
          setDeployBtnLoading(false);
          handleMessage('success', 'Transaction successful!');
        } else {
          setDeployBtnLoading(false);
          handleMessage('error', 'Transaction failed!');
        }

        setTokenName('');
        setTokenSymbol('');
        setTokenPrice('');
        setInitialMinit('');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setDeployBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const mintNewTokens = async () => {
    try {
      if (!newMint) {
        handleMessage('warning', 'Please enter no. of tokens.');
      } else {
        setMintBtnLoading(true);

        let mintPrice = await writerERC20.getTokenPrice();
        mintPrice = String(mintPrice * newMint);

        const txn = await writerERC20.mint(Number(newMint), { value: mintPrice });

        const receipt = await txn.wait();

        if (receipt.status === 1) {
          setMintBtnLoading(false);
          handleMessage('success', 'Transaction successful!');
        } else {
          setMintBtnLoading(false);
          handleMessage('error', 'Transaction failed!');
        }

        setNewMint('');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setMintBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  return (
    <div className='contract-content'>
      {!userHasDeployed ? (
        <>
          <Note width='fit-content' margin='auto' type='secondary' label={false}>
            Deploy ERC20 contract to create token gated access to your blog.
          </Note>
          <Spacer h={2} />
          <Description
            title='Deployment Fee'
            content={
              !deploymentFee ? <Spinner /> : <Tag type='lite'>{ethers.utils.formatEther(deploymentFee) + ' MATIC'}</Tag>
            }
          />
          <Spacer h={2} />
          <div className='contract-form'>
            <Input value='ERC20' readOnly type='secondary' width='50%'>
              Contract Type
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='Token'
              onChange={(e) => setTokenName(e.target.value)}
              width='50%'
            >
              Token Name
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='TKN'
              onChange={(e) => setTokenSymbol(e.target.value)}
              width='50%'
            >
              Token Symbol
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='0.02'
              onChange={(e) => setTokenPrice(e.target.value)}
              width='50%'
            >
              Token Price (MATIC)
            </Input>
            <Input
              clearable
              type='secondary'
              placeholder='1000'
              onChange={(e) => setInitialMinit(e.target.value)}
              width='50%'
            >
              Initial Mint
            </Input>
            {deployBtnLoading ? (
              <Button type='secondary' shadow loading scale={0.8} className='btn' onClick={deployWriterERC20Contract}>
                Deploy Contract
              </Button>
            ) : (
              <Button type='secondary' shadow scale={0.8} className='btn' onClick={deployWriterERC20Contract}>
                Deploy Contract
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className='user-contract-content'>
          <div className='reads'>
            <Description
              title='Contract'
              content={
                !userDeployedContractAddress ? (
                  <Spinner />
                ) : (
                  <Link
                    href={`https://mumbai.polygonscan.com/address/${userDeployedContractAddress}`}
                    target={'_blank'}
                    icon
                  >
                    Polygonscan
                  </Link>
                )
              }
            />
            <Description title='Token Name' content={!userTokenName ? <Spinner /> : userTokenName} />
            <Description title='Token Symbol' content={!userTokenSymbol ? <Spinner /> : userTokenSymbol} />
            <Description title='Token Price' content={!userTokenPrice ? <Spinner /> : userTokenPrice} />
            <Description title='Total Minted' content={!userTokenTotalMinted ? <Spinner /> : userTokenTotalMinted} />
            <Description
              title='Contract Balance'
              content={!userTokenContractBalance ? <Spinner /> : userTokenContractBalance}
            />
            <Description title='Your Token Balance' content={!userTokenBalance ? <Spinner /> : userTokenBalance} />
          </div>
          <div className='writes'>
            <div className='write'>
              <Input
                clearable
                type='secondary'
                placeholder='1000'
                onChange={(e) => setNewMint(e.target.value)}
                width='80%'
              >
                Mint New Tokens
              </Input>
              {mintBtnLoading ? (
                <Button type='secondary' shadow loading className='btn' scale={0.8}>
                  Mint
                </Button>
              ) : (
                <Button type='secondary' shadow className='btn' scale={0.8} onClick={mintNewTokens}>
                  Mint
                </Button>
              )}
            </div>
            <div className='write'>
              <Input
                clearable
                type='secondary'
                placeholder='0x0'
                onChange={(e) => setTransferAddress(e.target.value)}
                width='80%'
              >
                Transfer Tokens
              </Input>
              {transferBtnLoading ? (
                <Button type='secondary' shadow loading className='btn' scale={0.8}>
                  Transfer
                </Button>
              ) : (
                <Button type='secondary' shadow className='btn' scale={0.8}>
                  Transfer
                </Button>
              )}
            </div>
            <div className='write'>
              <Input
                clearable
                type='secondary'
                placeholder='0.003'
                onChange={(e) => setNewTokenPrice(e.target.value)}
                width='80%'
              >
                Set New Token Price (MATIC)
              </Input>
              {changePriceBtnLoading ? (
                <Button type='secondary' shadow loading className='btn' scale={0.8}>
                  Change Price
                </Button>
              ) : (
                <Button type='secondary' shadow className='btn' scale={0.8}>
                  Change Price
                </Button>
              )}
            </div>
          </div>
          <div className='withdraw-balance'>
            {withdrawBtnLoading ? (
              <Button type='secondary' shadow loading auto scale={0.8}>
                Widthdraw Balance
              </Button>
            ) : (
              <Button type='secondary' shadow auto scale={0.8}>
                Widthdraw Balance
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
