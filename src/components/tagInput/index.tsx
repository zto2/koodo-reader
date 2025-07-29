import { connect } from "react-redux";
import { stateType } from "../../store";
import TagInput from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    notes: state.reader.notes,
  };
};

export default connect(mapStateToProps)(withTranslation()(TagInput) as any);
