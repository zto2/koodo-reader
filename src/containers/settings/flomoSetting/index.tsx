import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import FlomoSetting from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {};
};

const actionCreator = {};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(FlomoSetting as any) as any);
