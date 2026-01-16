import React from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const ApiDocs = () => {
  return (
    <div style={{ margin: "2rem" }}>
        <h1>API Documentation</h1>
        <SwaggerUI url="/Swagger/swagger.json" />
    </div>
  );
};

export default ApiDocs;
