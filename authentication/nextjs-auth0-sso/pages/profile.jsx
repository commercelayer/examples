import React from 'react'
import { Row, Col } from 'reactstrap'
import { useUser } from '@auth0/nextjs-auth0'

import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import Highlight from '../components/Highlight'

export default function Profile() {
  const { user, isLoading, error } = useUser()

  if (error) {
    return <ErrorMessage>{error.message}</ErrorMessage>
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <>
      {isLoading && <Loading />}
      {user && (
        <>
          <Row
            className="align-items-center profile-header mb-5 text-center text-md-left"
            data-testid="profile"
          >
            <Col md={2}>
              <img
                src={user.picture}
                alt="Profile"
                className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
                decode="async"
                data-testid="profile-picture"
              />
            </Col>
            <Col md>
              <h2 data-testid="profile-name">{user.name}</h2>
              <p className="lead text-muted" data-testid="profile-email">
                {user.email}
              </p>
            </Col>
          </Row>
          <Row data-testid="profile-json">
            <Highlight>{JSON.stringify(user, null, 2)}</Highlight>
          </Row>
        </>
      )}
    </>
  )
}
