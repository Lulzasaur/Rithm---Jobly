
const sqlForPartialUpdate = require('../../helpers/partialUpdate')

describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field",
      function () {

    // FIXME: write real tests!
    const response = sqlForPartialUpdate('test',{'test_field_1':'pickles','test_field_3':'potatoes','test_field_9':'apples'},'test_field_1','valueEqual');
    expect(response).toEqual({
      "query": "UPDATE test SET test_field_1=$1, test_field_3=$2, test_field_9=$3 WHERE test_field_1=$4 RETURNING *",
      "values": ["pickles","potatoes","apples","valueEqual"]
    });
  }
)});

