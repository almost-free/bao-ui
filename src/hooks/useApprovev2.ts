import { useCallback } from 'react'
import { useWallet } from 'use-wallet'
import { Contract } from 'web3-eth-contract'
import { approvev2 } from '../bao/utils'

const useApprovev2 = (tokenContract: Contract, spenderContract: Contract) => {
  const { account } = useWallet()

  const handleApprove = useCallback(() => {
    return approvev2(tokenContract, spenderContract, account)
  }, [account, tokenContract, spenderContract])

  return { onApprove: handleApprove }
}

export default useApprovev2
