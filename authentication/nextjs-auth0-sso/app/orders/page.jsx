'use client'

import { useUser } from '@auth0/nextjs-auth0'
import {
  CommerceLayer,
  CustomerContainer,
  OrderListEmpty,
  OrderList,
  OrderListRow,
} from '@commercelayer/react-components'
import { useCommerceLayerAuth } from '../../providers/CommerceLayerAuth'

const columns = [
  {
    header: 'Order',
    accessorKey: 'number',
  },
  {
    header: 'Status',
    accessorKey: 'status',
  },
  {
    header: 'Date',
    accessorKey: 'updated_at',
  },
  {
    header: 'Amount',
    accessorKey: 'formatted_total_amount_with_taxes',
    id: 'total_amount_cents',
  },
]

export default function Orders() {
  const { user, isLoading, error } = useUser()
  const { auth, isLoading: isLoadingCL } = useCommerceLayerAuth()

  if (error) {
    return <div>{error.message}</div>
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      {!isLoadingCL && (
        <div className="mb-5">
          <h1>Orders</h1>
          <div>
            <CommerceLayer accessToken={auth.accessToken}>
              <CustomerContainer>
                <OrderList
                  type="orders"
                  className="table table-bordered w-100"
                  columns={columns}
                  theadClassName="thead-light"
                  rowTrClassName="border-bottom"
                  showPagination
                  pageSize={15}
                  paginationContainerClassName="d-flex justify-content-between align-items-center"
                >
                  <OrderListEmpty />

                  <OrderListRow field="number">
                    {({ cell, order, ...p }) => {
                      return (
                        <>
                          {cell?.map((cell, index) => (
                            <div {...p} key={cell.id}>
                              <p
                                className="font-weight-bold"
                                key={`order-${cell.id}-${index}`}
                              >
                                Order # {cell.renderValue()}
                              </p>
                            </div>
                          ))}
                        </>
                      )
                    }}
                  </OrderListRow>
                  <OrderListRow
                    field="status"
                    className="align-top border-bottom"
                  />
                  <OrderListRow
                    field="updated_at"
                    className="align-top border-bottom"
                  />
                  <OrderListRow
                    field="total_amount_cents"
                    className="align-top border-bottom font-weight-bold"
                  />
                </OrderList>
              </CustomerContainer>
            </CommerceLayer>
          </div>
        </div>
      )}
    </>
  )
}
