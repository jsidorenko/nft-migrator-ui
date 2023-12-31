import { memo } from 'react';
import { Card } from 'react-bootstrap';
import { styled } from 'styled-components';

import { getFetchableImageUrl } from '@helpers/utilities.ts';

const SImg = styled.div`
  img {
    max-width: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`;

interface ShowImageProps {
  imageCid?: string;
  altText?: string;
}

const ShowImage = ({ imageCid, altText }: ShowImageProps) => {
  if (!imageCid) {
    return (
      <SImg>
        <Card.Img className='rounded-bottom-0' src='https://placehold.co/312?text=no image' alt='placeholder image' />
      </SImg>
    );
  }

  return (
    <SImg>
      <a href={getFetchableImageUrl(imageCid)} target='_blank' rel='noreferrer'>
        <Card.Img src={getFetchableImageUrl(imageCid)} alt={altText} />
      </a>
    </SImg>
  );
};

export default memo(ShowImage);
