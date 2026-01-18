import React, { useMemo } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import swaggerDocument from "./swagger.json";
import "./swagger.scss"

const ApiDocs = () => {
  const swaggerWithServer = useMemo(() => ({
    ...swaggerDocument,
    servers: [
      { url: `${process.env.REACT_APP_API_URL}/api` }
    ]
  }), []);

  return (
    <div className="swagger-wrapper" style={{ margin: "2rem" }}>
      <h1>API Documentation</h1>
      <SwaggerUI spec={swaggerWithServer} />
    </div>
  );
};

export default ApiDocs;
