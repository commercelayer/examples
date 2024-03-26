import React from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import {
  CommerceLayer,
  CustomerContainer,
  OrderListEmpty,
  OrderList,
  OrderListRow
} from '@commercelayer/react-components';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useCommerceLayerAuth } from '../providers/CommerceLayerAuth';

const columns = [
  {
    header: 'Order',
    accessorKey: 'number'
  },
  {
    header: 'Status',
    accessorKey: 'status'
  },
  {
    header: 'Date',
    accessorKey: 'updated_at'
  },
  {
    header: 'Amount',
    accessorKey: 'formatted_total_amount_with_taxes'
  }
];

function Orders() {
  const { auth, isLoading } = useCommerceLayerAuth();

  return (
    <>
      {!isLoading && (
        <div className="mb-5">
          <h1>Orders</h1>
          <div>
            <CommerceLayer
              accessToken={auth.accessToken}
              endpoint={`https://${process.env.NEXT_PUBLIC_CL_ENDPOINT}.commercelayer.io`}
            >
              <CustomerContainer>
                <OrderList className="table" columns={columns}>
                  <OrderListEmpty />
                  <OrderListRow field="number">
                    {({ cell, order, ...p }) => {
                      return (
                        <>
                          {cell?.map((cell) => {
                            return <p>Order # {cell.renderValue()}</p>;
                          })}
                        </>
                      );
                    }}
                  </OrderListRow>
                  <OrderListRow field="status" />
                  <OrderListRow field="updated_at" />
                  <OrderListRow field="formatted_total_amount_with_taxes" />
                </OrderList>
              </CustomerContainer>
            </CommerceLayer>
          </div>
        </div>
      )}
    </>
  );
}

export default withPageAuthRequired(Orders, {
  onRedirecting: () => <Loading />,
  onError: (error) => <ErrorMessage>{error.message}</ErrorMessage>
});
