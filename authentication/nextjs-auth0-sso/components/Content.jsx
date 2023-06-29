import React from 'react';
import { Row, Col } from 'reactstrap';
import {
  OrderContainer,
  OrderStorage,
  CommerceLayer,
  PricesContainer,
  Price,
  SkusContainer,
  SkuField,
  Skus,
  AddToCartButton
} from '@commercelayer/react-components';

import { useCommerceLayerAuth } from '../providers/CommerceLayerAuth';

const skuCode = 'TSHIRTMS000000FFFFFFLXXX';
const websiteUrl = 'http://localhost:3000';

const Content = () => {
  const { auth } = useCommerceLayerAuth();

  return (
    <CommerceLayer
      accessToken={auth?.accessToken}
      endpoint={`https://${process.env.NEXT_PUBLIC_CL_ENDPOINT}.commercelayer.io`}>
      <div className="next-steps my-5">
        <Row className="d-flex justify-content-between">
          <Col key={0} md={5} className="mb-4">
            <OrderStorage persistKey="my-order">
              <OrderContainer attributes={{ return_url: websiteUrl, cart_url: websiteUrl }}>
                <SkusContainer skus={[skuCode]}>
                  <div className="card" style={{ width: '18rem' }}>
                    <Skus>
                      <SkuField attribute="image_url" className="card-img-top" tagElement="img" />
                      <div className="card-body">
                        <SkuField attribute="name" className="card-title" tagElement="h5" />
                        <SkuField attribute="description" className="card-text" tagElement="p" />
                        <PricesContainer>
                          <Price skuCode={skuCode}>
                            {({ prices }) => {
                              if (prices.length > 0) {
                                const { formatted_amount, formatted_compare_at_amount } = prices[0];
                                return (
                                  <p>
                                    <span>{formatted_amount}</span>{' '}
                                    <span>
                                      <del>{formatted_compare_at_amount}</del>
                                    </span>
                                  </p>
                                );
                              }
                            }}
                          </Price>
                        </PricesContainer>
                        <AddToCartButton className="btn btn-primary" buyNowMode skuCode={skuCode} />
                      </div>
                    </Skus>
                  </div>
                </SkusContainer>
              </OrderContainer>
            </OrderStorage>
          </Col>
        </Row>
      </div>
    </CommerceLayer>
  );
};

export default Content;
