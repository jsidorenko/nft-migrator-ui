import { memo, useEffect } from 'react';

import Title from '@common/Title.tsx';

import { alternateBackground } from '@helpers/utilities.ts';

const ClaimNft = () => {
  useEffect(() => {
    return alternateBackground();
  }, []);

  return (
    <>
      <Title className='main'>Claim NFT</Title>
      <div>teasasdasd</div>
    </>
  );
};

export default memo(ClaimNft);
